// Teacher Dashboard Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard = () => {
    const { userProfile, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
        activeCourses: 0,
        avgProgress: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // TODO: Fetch from API
            // Placeholder data for now
            setCourses([
                {
                    id: 1,
                    title: 'Mathematics Grade 4',
                    students: 25,
                    progress: 65,
                    status: 'published'
                },
                {
                    id: 2,
                    title: 'English Language Arts',
                    students: 30,
                    progress: 42,
                    status: 'published'
                }
            ]);
            
            setStats({
                totalCourses: 2,
                totalStudents: 55,
                activeCourses: 2,
                avgProgress: 53.5
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
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
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-3xl font-bold text-purple-600">
                                🎓 IncludEd
                            </h1>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600 font-medium">Teacher Portal</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                    {userProfile?.profile?.first_name} {userProfile?.profile?.last_name}
                                </p>
                                <p className="text-xs text-gray-500">Teacher</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome back, {userProfile?.profile?.first_name}! 👋
                    </h2>
                    <p className="text-gray-600">
                        Here's what's happening with your courses today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.totalCourses}
                                </p>
                            </div>
                            <div className="bg-purple-100 rounded-full p-3">
                                <span className="text-2xl">📚</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Students</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.totalStudents}
                                </p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <span className="text-2xl">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.activeCourses}
                                </p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <span className="text-2xl">✅</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.avgProgress.toFixed(1)}%
                                </p>
                            </div>
                            <div className="bg-orange-100 rounded-full p-3">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">🤖 AI-Powered Course Creation</h3>
                    <p className="mb-6 text-purple-100">
                        Upload a REB syllabus and let AI generate a complete course with modules, lessons, and assessments.
                    </p>
                    <Link
                        to="/teacher/courses/create"
                        className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition"
                    >
                        <span className="mr-2">✨</span>
                        Create New Course with AI
                    </Link>
                </div>

                {/* Courses List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Your Courses
                            </h3>
                            <Link
                                to="/teacher/courses"
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                View All →
                            </Link>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {courses.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <p className="text-gray-500 mb-4">No courses yet</p>
                                <Link
                                    to="/teacher/courses/create"
                                    className="btn btn-primary"
                                >
                                    Create Your First Course
                                </Link>
                            </div>
                        ) : (
                            courses.map(course => (
                                <div key={course.id} className="px-6 py-4 hover:bg-gray-50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    {course.title}
                                                </h4>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                    {course.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <span>👥 {course.students} students</span>
                                                <span>•</span>
                                                <span>📊 {course.progress}% avg. progress</span>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/teacher/courses/${course.id}`}
                                            className="btn btn-secondary text-sm"
                                        >
                                            Manage Course
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
