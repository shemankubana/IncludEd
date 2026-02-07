import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { currentUser, userProfile, getToken } = useAuth();
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            const token = await getToken();
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/students/courses`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            setEnrolledCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading-spinner-large"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            📐 IncludEd Mathematics
                        </h1>
                        <p className="text-sm text-gray-600">
                            Welcome back, {userProfile?.first_name || 'Student'}!
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="btn btn-secondary">
                            ⚙️ Settings
                        </button>
                        <button 
                            onClick={() => {/* logout */}}
                            className="btn btn-outline"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
                    <h2 className="text-3xl font-bold mb-2">
                        Ready to Learn Mathematics?
                    </h2>
                    <p className="text-lg opacity-90">
                        Continue where you left off or start a new lesson
                    </p>
                </div>

                {/* Courses Grid */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        My Mathematics Courses
                    </h3>
                    
                    {enrolledCourses.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No courses yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Ask your teacher to enroll you in a mathematics course
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/student/courses/${course.id}`)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                {course.title}
                                            </h4>
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                                                Grade {course.grade_level}
                                            </span>
                                        </div>
                                        
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {course.description}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Progress</span>
                                                <span className="font-semibold text-indigo-600">
                                                    {course.progress || 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${course.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button className="w-full btn btn-primary">
                                            Continue Learning →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl mb-2">📚</div>
                        <p className="text-2xl font-bold text-gray-900">
                            {enrolledCourses.length}
                        </p>
                        <p className="text-sm text-gray-600">Active Courses</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl mb-2">✅</div>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                        <p className="text-sm text-gray-600">Completed Lessons</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl mb-2">🎯</div>
                        <p className="text-2xl font-bold text-gray-900">0%</p>
                        <p className="text-sm text-gray-600">Average Score</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl mb-2">⏱️</div>
                        <p className="text-2xl font-bold text-gray-900">0h</p>
                        <p className="text-sm text-gray-600">Time Spent</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
