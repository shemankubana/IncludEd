import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Redirect if already logged in
    React.useEffect(() => {
        if (currentUser) {
            navigate('/student/dashboard');
        }
    }, [currentUser, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center text-white mb-16">
                    <h1 className="text-6xl font-bold mb-4">
                        📐 IncludEd Mathematics
                    </h1>
                    <p className="text-2xl font-light mb-2">
                        AI-Powered Learning for Every Student
                    </p>
                    <p className="text-lg opacity-90">
                        Designed for students with dyslexia, ADHD, and diverse learning needs
                    </p>
                </div>

                {/* Hero Section */}
                <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-12 mb-16">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Welcome to Inclusive Mathematics
                            </h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Our platform uses AI to adapt to your unique learning style. 
                                Draw solutions on an interactive canvas, get personalized hints, 
                                and learn at your own pace.
                            </p>
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">✏️</span>
                                    <span className="text-gray-700">Interactive canvas for visual problem-solving</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🧠</span>
                                    <span className="text-gray-700">AI that detects when you need help</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🎯</span>
                                    <span className="text-gray-700">Step-by-step guidance and hints</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">♿</span>
                                    <span className="text-gray-700">Built for dyslexia and ADHD support</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/register')}
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                                >
                                    Get Started Free
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
                                >
                                    Sign In
                                </button>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 text-center">
                                <div className="text-6xl mb-4">📊</div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    Proven Results
                                </h3>
                                <div className="space-y-3 text-left">
                                    <div className="bg-white rounded-lg p-4">
                                        <p className="text-3xl font-bold text-indigo-600">50%</p>
                                        <p className="text-sm text-gray-600">Increase in engagement</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4">
                                        <p className="text-3xl font-bold text-purple-600">25%</p>
                                        <p className="text-sm text-gray-600">Better problem-solving</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4">
                                        <p className="text-3xl font-bold text-pink-600">92%</p>
                                        <p className="text-sm text-gray-600">Student satisfaction</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <div className="text-4xl mb-4">👨‍🏫</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">For Teachers</h3>
                        <p className="text-gray-600 mb-4">
                            Create courses in minutes with AI. Upload REB syllabi and let GPT-4 
                            generate structured lessons automatically.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>✓ AI course generation</li>
                            <li>✓ Student progress tracking</li>
                            <li>✓ Accessibility insights</li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <div className="text-4xl mb-4">👩‍🎓</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">For Students</h3>
                        <p className="text-gray-600 mb-4">
                            Learn mathematics your way. Draw solutions, request hints, and get 
                            personalized support when you need it.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>✓ Interactive canvas</li>
                            <li>✓ Text-to-speech</li>
                            <li>✓ Customizable interface</li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <div className="text-4xl mb-4">🤖</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered</h3>
                        <p className="text-gray-600 mb-4">
                            Our RL model detects struggle patterns and provides real-time 
                            interventions tailored to each student.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>✓ Pattern detection</li>
                            <li>✓ Adaptive difficulty</li>
                            <li>✓ Smart interventions</li>
                        </ul>
                    </div>
                </div>

                {/* CTA Footer */}
                <div className="text-center text-white">
                    <p className="text-lg mb-4">
                        Ready to transform mathematics education?
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-12 py-5 bg-white text-indigo-600 rounded-full font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        Start Learning Today →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
