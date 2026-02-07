// AI Course Creation Component
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CreateCourse = () => {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1); // 1: Upload, 2: Processing, 3: Preview, 4: Published
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        gradeLevel: 4,
        language: 'en',
        syllabusFile: null,
        syllabusUrl: ''
    });
    const [generatedCourse, setGeneratedCourse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload a PDF or DOCX file');
                return;
            }
            setFormData({ ...formData, syllabusFile: file });
            setError('');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleGenerateCourse = async () => {
        if (!formData.syllabusFile && !formData.syllabusUrl) {
            setError('Please upload a syllabus file or provide a URL');
            return;
        }

        if (!formData.title || !formData.subject) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');
        setStep(2);

        try {
            const token = await getToken();
            const formDataToSend = new FormData();
            
            formDataToSend.append('title', formData.title);
            formDataToSend.append('subject', formData.subject);
            formDataToSend.append('gradeLevel', formData.gradeLevel);
            formDataToSend.append('language', formData.language);
            
            if (formData.syllabusFile) {
                formDataToSend.append('syllabusFile', formData.syllabusFile);
            } else {
                formDataToSend.append('syllabusUrl', formData.syllabusUrl);
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/courses/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            if (!response.ok) {
                throw new Error('Failed to generate course');
            }

            const data = await response.json();
            setGeneratedCourse(data);
            setStep(3);
        } catch (err) {
            setError(err.message || 'Failed to generate course');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishCourse = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/courses/${generatedCourse.id}/publish`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to publish course');
            }

            setStep(4);
            setTimeout(() => {
                navigate('/teacher/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to publish course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🤖 AI-Powered Course Creation
                    </h1>
                    <p className="text-gray-600">
                        Upload a REB syllabus and let AI generate your course content
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {[
                            { num: 1, label: 'Upload Syllabus' },
                            { num: 2, label: 'AI Processing' },
                            { num: 3, label: 'Review & Edit' },
                            { num: 4, label: 'Publish' }
                        ].map((s, idx) => (
                            <React.Fragment key={s.num}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            step >= s.num
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}
                                    >
                                        {step > s.num ? '✓' : s.num}
                                    </div>
                                    <span className="text-xs mt-2 text-gray-600">{s.label}</span>
                                </div>
                                {idx < 3 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 ${
                                            step > s.num ? 'bg-purple-600' : 'bg-gray-200'
                                        }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Step 1: Upload Form */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            Course Information
                        </h2>

                        <div className="space-y-6">
                            {/* Course Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Course Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Mathematics for Grade 4"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Select subject</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="English">English Language Arts</option>
                                    <option value="Science">Science</option>
                                    <option value="Social Studies">Social Studies</option>
                                    <option value="Kinyarwanda">Kinyarwanda</option>
                                    <option value="French">French</option>
                                </select>
                            </div>

                            {/* Grade Level & Language */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Grade Level
                                    </label>
                                    <select
                                        name="gradeLevel"
                                        value={formData.gradeLevel}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="3">Grade 3</option>
                                        <option value="4">Grade 4</option>
                                        <option value="5">Grade 5</option>
                                        <option value="6">Grade 6</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Language
                                    </label>
                                    <select
                                        name="language"
                                        value={formData.language}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="en">English</option>
                                        <option value="fr">French</option>
                                        <option value="rw">Kinyarwanda</option>
                                    </select>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload REB Syllabus (PDF or DOCX)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer"
                                    >
                                        <div className="text-4xl mb-2">📄</div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            {formData.syllabusFile
                                                ? formData.syllabusFile.name
                                                : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PDF or DOCX up to 10MB
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {/* OR Divider */}
                            <div className="flex items-center">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="px-4 text-sm text-gray-500">OR</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            {/* URL Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Syllabus URL
                                </label>
                                <input
                                    type="url"
                                    name="syllabusUrl"
                                    value={formData.syllabusUrl}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="https://example.com/syllabus.pdf"
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateCourse}
                                disabled={loading}
                                className="w-full btn btn-primary py-3 text-lg"
                            >
                                {loading ? (
                                    <>
                                        <span className="loading-spinner mr-2"></span>
                                        Generating Course...
                                    </>
                                ) : (
                                    <>
                                        <span className="mr-2">✨</span>
                                        Generate Course with AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Processing */}
                {step === 2 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="loading-spinner-large mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            AI is Creating Your Course...
                        </h2>
                        <p className="text-gray-600 mb-4">
                            This may take a few minutes. We're analyzing the syllabus and generating:
                        </p>
                        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
                            <li>✓ Course structure and modules</li>
                            <li>✓ Learning objectives</li>
                            <li>✓ Lesson content</li>
                            <li>✓ Assessments and quizzes</li>
                        </ul>
                    </div>
                )}

                {/* Step 3: Preview (placeholder) */}
                {step === 3 && generatedCourse && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Review Generated Course
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Course generated successfully! Review and edit before publishing.
                        </p>
                        <button
                            onClick={handlePublishCourse}
                            className="btn btn-primary"
                        >
                            Publish Course
                        </button>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Course Published Successfully!
                        </h2>
                        <p className="text-gray-600">
                            Redirecting to dashboard...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateCourse;
