import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import axios from "axios";

const PianoLocationForm = () => {
  const navigate = useNavigate();
  const { pickup, setPickup, delivery, setDelivery, piano, setPiano } = useBooking();

  const [pickupQuery, setPickupQuery] = useState(pickup.location || '');
  const [deliveryQuery, setDeliveryQuery] = useState(delivery.location || '');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState([]);
  const [errors, setErrors] = useState({ pickupLocation: false, deliveryLocation: false });

  const [focusedPickupIndex, setFocusedPickupIndex] = useState(-1);
  const [focusedDeliveryIndex, setFocusedDeliveryIndex] = useState(-1);

  const pickupSelectedRef = useRef(false);
  const deliverySelectedRef = useRef(false);

  const floorOptions = [
    "Ground floor", "1st floor", "2nd floor", "3rd floor", "4th floor", "5th floor +"
  ];

  const pianoTypes = [
    "Upright Piano", "Baby Grand Piano", "Grand Piano",
    "Digital Piano", "Electric Piano", "Console Piano"
  ];

  // Autocomplete for pickup
  useEffect(() => {
    if (pickupQuery.trim() === '' || pickupSelectedRef.current) {
      setPickupSuggestions([]);
      pickupSelectedRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      axios.post("https://reliance-orbit.onrender.com/autocomplete", { place: pickupQuery })
        .then(res => {
          setPickupSuggestions(res.data.predictions || []);
          setFocusedPickupIndex(-1);
        })
        .catch(() => setPickupSuggestions([]));
    }, 500);

    return () => clearTimeout(timeout);
  }, [pickupQuery]);

  // Autocomplete for delivery
  useEffect(() => {
    if (deliveryQuery.trim() === '' || deliverySelectedRef.current) {
      setDeliverySuggestions([]);
      deliverySelectedRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      axios.post("https://reliance-orbit.onrender.com/autocomplete", { place: deliveryQuery })
        .then(res => {
          setDeliverySuggestions(res.data.predictions || []);
          setFocusedDeliveryIndex(-1);
        })
        .catch(() => setDeliverySuggestions([]));
    }, 500);

    return () => clearTimeout(timeout);
  }, [deliveryQuery]);

  // Suggestion handlers
  const handlePickupSuggestionSelect = (suggestion) => {
    pickupSelectedRef.current = true;
    setPickupQuery(suggestion.description);
    setPickup({ ...pickup, location: suggestion.description });
    setPickupSuggestions([]);
    setErrors(prev => ({ ...prev, pickupLocation: false }));
  };

  const handleDeliverySuggestionSelect = (suggestion) => {
    deliverySelectedRef.current = true;
    setDeliveryQuery(suggestion.description);
    setDelivery({ ...delivery, location: suggestion.description });
    setDeliverySuggestions([]);
    setErrors(prev => ({ ...prev, deliveryLocation: false }));
  };

  // Keyboard nav
  const handlePickupKeyDown = (e) => {
    if (!pickupSuggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedPickupIndex(prev => (prev < pickupSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedPickupIndex(prev => (prev > 0 ? prev - 1 : pickupSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const index = focusedPickupIndex >= 0 ? focusedPickupIndex : 0;
      handlePickupSuggestionSelect(pickupSuggestions[index]);
    } else if (e.key === 'Escape') {
      setPickupSuggestions([]);
    }
  };

  const handleDeliveryKeyDown = (e) => {
    if (!deliverySuggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedDeliveryIndex(prev => (prev < deliverySuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedDeliveryIndex(prev => (prev > 0 ? prev - 1 : deliverySuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const index = focusedDeliveryIndex >= 0 ? focusedDeliveryIndex : 0;
      handleDeliverySuggestionSelect(deliverySuggestions[index]);
    } else if (e.key === 'Escape') {
      setDeliverySuggestions([]);
    }
  };

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const hasPickup = pickupQuery.trim() !== '';
    const hasDelivery = deliveryQuery.trim() !== '';
    setErrors({
      pickupLocation: !hasPickup,
      deliveryLocation: !hasDelivery,
    });

    if (hasPickup && hasDelivery) {
      setPickup({ ...pickup, location: pickupQuery });
      setDelivery({ ...delivery, location: deliveryQuery });
      navigate('/date');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Where are you moving from and to?" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">

              {/* Piano Type */}
              <div className="p-6 border-b border-gray-200">
                <select
                  value={piano?.type || ''}
                  onChange={(e) => setPiano({ ...piano, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select Your Piano Type</option>
                  {pianoTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              {/* Pickup Section */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Pickup Details</h2>

                <div className="mb-4">
                  <label className="block mb-1">Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pickupQuery}
                      onChange={(e) => {
                        setPickupQuery(e.target.value);
                        setErrors(prev => ({ ...prev, pickupLocation: false }));
                      }}
                      onKeyDown={handlePickupKeyDown}
                      className={`w-full px-4 py-2 border ${errors.pickupLocation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter pickup address"
                    />
                    {pickupSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
                        {pickupSuggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            onClick={() => handlePickupSuggestionSelect(suggestion)}
                            className={`px-4 py-2 cursor-pointer ${idx === focusedPickupIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                          >
                            {suggestion.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.pickupLocation && <p className="text-red-600 text-sm mt-1">Pickup address is required</p>}
                </div>

                <div className="mb-4">
                  <label className="block mb-1">Floor</label>
                  <select
                    value={pickup.floor}
                    onChange={(e) => setPickup({ ...pickup, floor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md"
                  >
                    {floorOptions.map(floor => <option key={floor}>{floor}</option>)}
                  </select>
                </div>
              </div>

              {/* Delivery Section */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Delivery Details</h2>

                <div className="mb-4">
                  <label className="block mb-1">Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={deliveryQuery}
                      onChange={(e) => {
                        setDeliveryQuery(e.target.value);
                        setErrors(prev => ({ ...prev, deliveryLocation: false }));
                      }}
                      onKeyDown={handleDeliveryKeyDown}
                      className={`w-full px-4 py-2 border ${errors.deliveryLocation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter delivery address"
                    />
                    {deliverySuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
                        {deliverySuggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleDeliverySuggestionSelect(suggestion)}
                            className={`px-4 py-2 cursor-pointer ${idx === focusedDeliveryIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                          >
                            {suggestion.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.deliveryLocation && <p className="text-red-600 text-sm mt-1">Delivery address is required</p>}
                </div>

                <div className="mb-4">
                  <label className="block mb-1">Floor</label>
                  <select
                    value={delivery.floor}
                    onChange={(e) => setDelivery({ ...delivery, floor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md"
                  >
                    {floorOptions.map(floor => <option key={floor}>{floor}</option>)}
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                >
                  Next Step →
                </button>
              </div>
            </form>
          </div>

          <OrderSummary />
        </div>
      </div>
    </div>
  );
};

export default PianoLocationForm;
