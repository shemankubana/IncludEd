const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, requireRole } = require('../middleware/auth');
const { Pool } = require('pg');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// OpenAI configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
        }
    }
});

/**
 * Extract text from uploaded file
 */
async function extractTextFromFile(filePath, mimetype) {
    try {
        const buffer = await fs.readFile(filePath);

        if (mimetype === 'application/pdf') {
            const data = await pdfParse(buffer);
            return data.text;
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }

        throw new Error('Unsupported file type');
    } catch (error) {
        console.error('Text extraction error:', error);
        throw new Error('Failed to extract text from file');
    }
}

/**
 * Generate course structure using OpenAI
 */
async function generateCourseWithAI(syllabusText, courseInfo) {
    try {
        const prompt = `You are an expert educational content creator. Based on the following REB (Rwanda Education Board) syllabus, create a comprehensive course structure.

Course Information:
- Title: ${courseInfo.title}
- Subject: ${courseInfo.subject}
- Grade Level: ${courseInfo.gradeLevel}
- Language: ${courseInfo.language}

Syllabus Content:
${syllabusText.substring(0, 8000)} // Limit to avoid token limits

Please generate a JSON response with the following structure:
{
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "duration_minutes": 180,
      "learning_objectives": ["objective 1", "objective 2"],
      "lessons": [
        {
          "title": "Lesson title",
          "content_text": "Detailed lesson content",
          "duration_minutes": 45,
          "learning_objectives": ["objective 1"],
          "keywords": ["keyword1", "keyword2"],
          "assessment": {
            "title": "Lesson quiz",
            "questions": [
              {
                "type": "multiple_choice",
                "question": "Question text?",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "points": 10
              }
            ]
          }
        }
      ]
    }
  ]
}

Generate 3-5 modules with 3-5 lessons each. Make content engaging and appropriate for Grade ${courseInfo.gradeLevel} students.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert educational content creator specializing in creating inclusive, accessible learning materials for students with diverse learning needs."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const generatedContent = JSON.parse(completion.choices[0].message.content);
        return generatedContent;
    } catch (error) {
        console.error('OpenAI generation error:', error);
        throw new Error('Failed to generate course content with AI');
    }
}

/**
 * POST /api/courses/generate
 * Generate course from syllabus using AI
 */
router.post('/generate', verifyToken, requireRole('teacher'), upload.single('syllabusFile'), async (req, res) => {
    const client = await pool.connect();

    try {
        const { title, subject, gradeLevel, language, syllabusUrl } = req.body;
        const { uid } = req.user;

        // Get teacher ID
        const teacherResult = await pool.query(
            `SELECT t.id FROM teachers t 
             JOIN users u ON t.user_id = u.id 
             WHERE u.firebase_uid = $1`,
            [uid]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }

        const teacherId = teacherResult.rows[0].id;

        // Extract text from syllabus
        let syllabusText = '';
        let syllabusSource = '';

        if (req.file) {
            syllabusText = await extractTextFromFile(req.file.path, req.file.mimetype);
            syllabusSource = req.file.originalname;
            // Clean up uploaded file
            await fs.unlink(req.file.path);
        } else if (syllabusUrl) {
            // TODO: Fetch and extract from URL
            syllabusSource = syllabusUrl;
            syllabusText = 'URL-based syllabus extraction not yet implemented';
        } else {
            return res.status(400).json({ error: 'No syllabus file or URL provided' });
        }

        // Generate course content with AI
        const generatedContent = await generateCourseWithAI(syllabusText, {
            title,
            subject,
            gradeLevel,
            language
        });

        // Start database transaction
        await client.query('BEGIN');

        // Create course
        const courseResult = await client.query(
            `INSERT INTO courses (
                teacher_id, title, subject, grade_level, language, 
                status, ai_generated, syllabus_source, generation_prompt
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id`,
            [teacherId, title, subject, gradeLevel, language, 'draft', true, syllabusSource, syllabusText.substring(0, 500)]
        );

        const courseId = courseResult.rows[0].id;

        // Create modules and lessons
        for (let i = 0; i < generatedContent.modules.length; i++) {
            const module = generatedContent.modules[i];

            const moduleResult = await client.query(
                `INSERT INTO course_modules (
                    course_id, title, description, order_index, 
                    duration_minutes, learning_objectives
                ) VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING id`,
                [courseId, module.title, module.description, i + 1, module.duration_minutes, module.learning_objectives]
            );

            const moduleId = moduleResult.rows[0].id;

            // Create lessons
            for (let j = 0; j < module.lessons.length; j++) {
                const lesson = module.lessons[j];

                const lessonResult = await client.query(
                    `INSERT INTO lessons (
                        module_id, title, order_index, content_text, 
                        duration_minutes, learning_objectives, keywords
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
                    RETURNING id`,
                    [moduleId, lesson.title, j + 1, lesson.content_text, lesson.duration_minutes, lesson.learning_objectives, lesson.keywords]
                );

                const lessonId = lessonResult.rows[0].id;

                // Create assessment if exists
                if (lesson.assessment) {
                    await client.query(
                        `INSERT INTO assessments (
                            lesson_id, title, questions, total_points
                        ) VALUES ($1, $2, $3, $4)`,
                        [
                            lessonId,
                            lesson.assessment.title,
                            JSON.stringify(lesson.assessment.questions),
                            lesson.assessment.questions.reduce((sum, q) => sum + q.points, 0)
                        ]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            id: courseId,
            message: 'Course generated successfully',
            modules: generatedContent.modules.length,
            lessons: generatedContent.modules.reduce((sum, m) => sum + m.lessons.length, 0)
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Course generation error:', error);
        res.status(500).json({
            error: 'Failed to generate course',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/courses/:id/publish
 * Publish a draft course
 */
router.post('/:id/publish', verifyToken, requireRole('teacher'), async (req, res) => {
    try {
        const { id } = req.params;
        const { uid } = req.user;

        // Verify ownership
        const result = await pool.query(
            `UPDATE courses c
             SET status = 'published', published_at = NOW()
             FROM teachers t
             JOIN users u ON t.user_id = u.id
             WHERE c.id = $1 AND c.teacher_id = t.id AND u.firebase_uid = $2
             RETURNING c.id`,
            [id, uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found or unauthorized' });
        }

        res.json({ message: 'Course published successfully' });
    } catch (error) {
        console.error('Publish error:', error);
        res.status(500).json({ error: 'Failed to publish course' });
    }
});

module.exports = router;
