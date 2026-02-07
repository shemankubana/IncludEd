const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * POST /api/auth/register
 * Create user profile after Firebase registration
 */
router.post('/register', verifyToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { email, displayName, role, firebaseUid } = req.body;

        // Validate role
        if (!['teacher', 'student'].includes(role)) {
            return res.status(400).json({
                error: 'Invalid role. Must be either "teacher" or "student"'
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Create user record
        const userResult = await client.query(
            `INSERT INTO users (firebase_uid, email, role) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (firebase_uid) DO NOTHING
             RETURNING id`,
            [firebaseUid, email, role]
        );

        if (userResult.rows.length === 0) {
            // User already exists
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'User already exists'
            });
        }

        const userId = userResult.rows[0].id;

        // Parse display name
        const [firstName, ...lastNameParts] = displayName.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        // Create role-specific profile
        if (role === 'teacher') {
            await client.query(
                `INSERT INTO teachers (user_id, first_name, last_name) 
                 VALUES ($1, $2, $3)`,
                [userId, firstName, lastName]
            );
        } else if (role === 'student') {
            await client.query(
                `INSERT INTO students (user_id, first_name, last_name) 
                 VALUES ($1, $2, $3)`,
                [userId, firstName, lastName]
            );
        }

        // Set custom claims in Firebase
        await admin.auth().setCustomUserClaims(firebaseUid, { role });

        // Commit transaction
        await client.query('COMMIT');

        res.status(201).json({
            message: 'User profile created successfully',
            userId,
            role
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Failed to create user profile',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;

        // Get user from database
        const userResult = await pool.query(
            `SELECT id, email, role, created_at 
             FROM users 
             WHERE firebase_uid = $1`,
            [uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User profile not found'
            });
        }

        const user = userResult.rows[0];

        // Get role-specific profile
        let profile = null;

        if (user.role === 'teacher') {
            const teacherResult = await pool.query(
                `SELECT t.*, s.name as school_name 
                 FROM teachers t
                 LEFT JOIN schools s ON t.school_id = s.id
                 WHERE t.user_id = $1`,
                [user.id]
            );
            profile = teacherResult.rows[0];
        } else if (user.role === 'student') {
            const studentResult = await pool.query(
                `SELECT s.*, sc.name as school_name 
                 FROM students s
                 LEFT JOIN schools sc ON s.school_id = sc.id
                 WHERE s.user_id = $1`,
                [user.id]
            );
            profile = studentResult.rows[0];
        }

        res.json({
            ...user,
            profile
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch user profile',
            details: error.message
        });
    }
});

/**
 * PATCH /api/auth/profile
 * Update user profile
 */
router.patch('/profile', verifyToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { uid, role } = req.user;
        const updates = req.body;

        // Get user ID
        const userResult = await pool.query(
            'SELECT id FROM users WHERE firebase_uid = $1',
            [uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        await client.query('BEGIN');

        // Update role-specific profile
        if (role === 'teacher') {
            const allowedFields = ['first_name', 'last_name', 'school_id', 'specialization', 'bio', 'years_experience'];
            const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

            if (updateFields.length > 0) {
                const setClause = updateFields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
                const values = [userId, ...updateFields.map(field => updates[field])];

                await client.query(
                    `UPDATE teachers SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
                    values
                );
            }
        } else if (role === 'student') {
            const allowedFields = ['first_name', 'last_name', 'grade_level', 'school_id', 'disability_profile', 'accessibility_preferences'];
            const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

            if (updateFields.length > 0) {
                const setClause = updateFields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
                const values = [userId, ...updateFields.map(field => updates[field])];

                await client.query(
                    `UPDATE students SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
                    values
                );
            }
        }

        await client.query('COMMIT');

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            details: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
