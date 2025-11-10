import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import EmailPopup from '../components/EmailPopup';
import './Date.css';

const DateSelection = () => {
    // Navigation and routing
    const navigate = useNavigate();
    const location = useLocation();
    const prepath = location.state?.prepath;

    // Context and state management
    const { selectedDate, setSelectedDate, van, setVan } = useBooking();
    const [value, setValue] = useState(new Date());
    const [calendarPrices, setCalendarPrices] = useState({});
    const [bestPriceDates, setBestPriceDates] = useState([]);
    const [currentView, setCurrentView] = useState(new Date());
    const [selectedMovers, setSelectedMovers] = useState(selectedDate.numberOfMovers || 0);
    const [selectedVanType, setSelectedVanType] = useState(van.type || '');
    const [showEmailPopup, setShowEmailPopup] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    // Derived values
    const currentMonth = currentView.toLocaleString('default', { month: 'long' });
    const currentYear = currentView.getFullYear();

    // Van options configuration
    const vanOptions = [
        { type: 'Small', price: 60, emoji: '🚐' },
        { type: 'Medium', price: 70, emoji: '🚚' },
        { type: 'Large', price: 80, emoji: '🚛' },
        { type: 'Luton', price: 90, emoji: '📦' }
    ];

    useEffect(() => {
        // generatePriceData();
    }, []);

    const generatePriceData = () => {
        const prices = {};
        const bestPrices = [];
        const today = new Date();

        for (let i = 0; i < 60; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            let price;
            const day = date.getDay();

            if (day === 0 || day === 6) {
                price = 179 + Math.floor(Math.random() * 20);
            } else if (day === 2 || day === 4) {
                price = 139 + Math.floor(Math.random() * 10);
                if (Math.random() > 0.6) {
                    bestPrices.push(date.toDateString());
                }
            } else {
                price = 169 + Math.floor(Math.random() * 10);
            }

            prices[date.toDateString()] = price;
        }

        setCalendarPrices(prices);
        setBestPriceDates(bestPrices);
    };

    const handleEmailSubmit = (email) => {
        setUserEmail(email);
        setShowEmailPopup(false);
    };

    const formatSelectedDate = (date) => {
        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
    };

    const handleSelectDate = (date) => {
        setValue(date);
        const formattedDate = formatSelectedDate(date);
        const datePrice = calendarPrices[date.toDateString()] || 169;

        setSelectedDate({
            date: formattedDate,
            price: datePrice,
            numberOfMovers: selectedMovers || 0
        });
    };

    const handleSelectMovers = (count) => {
        setSelectedMovers(count);
        setSelectedDate({
            ...selectedDate,
            numberOfMovers: count
        });
    };

    const handleSelectVanType = (type) => {
        setSelectedVanType(type);
        setVan({ ...van, type: type });
    };

    const getVanEmoji = (type) => {
        const emojis = {
            'Small': '🚐',
            'Medium': '🚚',
            'Large': '🚛',
            'Luton': '📦'
        };
        return emojis[type] || '🚐';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!van.type || selectedDate.numberOfMovers === undefined) {
            setShowAlert(true);
            return;
        }
        navigate('/additional-services');
    };

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const dateString = date.toDateString();
        const price = calendarPrices[dateString];
        const isBestPrice = bestPriceDates.includes(dateString);

        return (
            <div className="text-center py-1">
                {price && <div className="text-sm font-medium text-gray-700">£{price}</div>}
                {isBestPrice && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded-sm">
                        Best Price!
                    </div>
                )}
            </div>
        );
    };

    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return '';
        const dateString = date.toDateString();
        const selectedDateString = value.toDateString();
        const isBestPrice = bestPriceDates.includes(dateString);

        if (dateString === selectedDateString) {
            return 'bg-blue-600 text-white rounded-lg';
        } else if (isBestPrice) {
            return 'bg-green-50 rounded-lg';
        }
        return '';
    };

    const handlePrevMonth = () => {
        const newDate = new Date(currentView);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentView(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentView);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentView(newDate);
    };

    const isCurrentMonth = () => {
        const today = new Date();
        return currentView.getMonth() === today.getMonth() && currentView.getFullYear() === today.getFullYear();
    };

    const isDateDisabled = ({ date, view }) => {
        if (view === 'month') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
        }
        return false;
    };

    return (
        <>
            {showEmailPopup && <EmailPopup onContinue={handleEmailSubmit} />}

            <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${showEmailPopup ? 'blur-sm' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main Form Section */}
                        <div className="flex-1">
                            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                                {/* Header with gradient */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                                    <h2 className="text-2xl font-bold flex items-center">
                                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m4 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v.01M8 7v8a1 1 0 001 1h6a1 1 0 001-1V7" />
                                        </svg>
                                        Select Date & Service
                                    </h2>
                                    <p className="text-blue-100 mt-1">Choose your van type, movers, and preferred date</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Van & Movers Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Van Selection */}
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414A1 1 0 0017.414 13H20" />
                                                </svg>
                                                Van Type
                                            </h3>
                                            <div className="relative">
                                                <select
                                                    value={van.type || ''}
                                                    onChange={(e) => handleSelectVanType(e.target.value)}
                                                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm font-medium text-gray-700"
                                                >
                                                    <option value="" disabled>Select Van Type</option>
                                                    {vanOptions.map((option) => (
                                                        <option key={option.type} value={option.type}>
                                                            {option.emoji} {option.type} 
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none">
                                                    {getVanEmoji(van.type)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Movers Selection */}
                                        <div className="space-y-3 md:col-span-2">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                Number of Movers
                                            </h3>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[0, 1, 2,3].map((count) => (
                                                    <button
                                                        key={count}
                                                        type="button"
                                                        className={`p-3 border-2 rounded-xl transition-all duration-200 backdrop-blur-sm group text-center ${selectedMovers === count
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                                                            }`}
                                                        onClick={() => handleSelectMovers(count)}
                                                    >
                                                        <div className="text-xl mb-1 group-hover:scale-110 transition-transform">
                                                            {/* {count === 0 ? '🚚' : count === 1 ? '👤' : '👥'} */}
                                                            {count === 0 ? '📦' : count === 1 ? '🚚' : count=== 2 ? '👤' : '👥'}
                                                        </div>
                                                        <div className="font-medium text-sm">
                                                            {/* {count === 0 ? 'Driver Only' : `${count} Person${count > 1 ? 's' : ''}`} */}
                                                            {count === 0 ? 'Customer loading & unloading' : count === 1 ? 'Driver Help' : `Driver+${count-1} Person${count > 2 ? 's' : ''}` }
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calendar Section */}
                                    <div className="border-t-2 border-gray-200 pt-6">
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
                                            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m4 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v.01M8 7v8a1 1 0 001 1h6a1 1 0 001-1V7" />
                                            </svg>
                                            Select Your Date
                                        </h3>

                                        {/* Calendar Navigation */}
                                        <div className="flex items-center justify-between mb-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200">
                                            <button
                                                type="button"
                                                className={`p-2 rounded-lg transition-all duration-200 ${isCurrentMonth() ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                                    }`}
                                                onClick={!isCurrentMonth() ? handlePrevMonth : undefined}
                                                disabled={isCurrentMonth()}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <div className="text-lg font-bold text-gray-800">{currentMonth} {currentYear}</div>
                                            <button
                                                type="button"
                                                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                                onClick={handleNextMonth}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Calendar */}
                                        <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
                                            <Calendar
                                                onChange={handleSelectDate}
                                                value={value}
                                                activeStartDate={currentView}
                                                onActiveStartDateChange={({ activeStartDate }) => setCurrentView(activeStartDate)}
                                                tileContent={tileContent}
                                                tileClassName={tileClassName}
                                                showNavigation={false}
                                                minDate={new Date()}
                                                tileDisabled={isDateDisabled}
                                                className="custom-calendar"
                                            />
                                        </div>
                                    </div>

                                </div>

                                {/* Action Buttons */}
                                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate(prepath)}
                                        className="flex items-center space-x-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium group"
                                    >
                                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                        </svg>
                                        <span>Edit Job Info</span>
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <span>Next Step</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="lg:w-1/3">
                            <OrderSummary />
                        </div>
                    </div>
                </div>

                {/* Alert Modal */}
                {showAlert && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 transform transition-all duration-300 scale-100">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-bold text-gray-900">Selection Required</h3>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p>Please select both the van type and number of movers before continuing.</p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                            onClick={() => setShowAlert(false)}
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default DateSelection;