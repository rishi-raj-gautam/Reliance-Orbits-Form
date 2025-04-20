import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import axios from "axios";

const LocationForm = () => {
  const { pickup, setPickup, delivery, setDelivery } = useBooking();
  const [pickupQuery, setPickupQuery] = useState(pickup.location || '');
  const [deliveryQuery, setDeliveryQuery] = useState(delivery.location || '');

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState([]);

  const [focusedPickupIndex, setFocusedPickupIndex] = useState(-1);
  const [focusedDeliveryIndex, setFocusedDeliveryIndex] = useState(-1);

  const pickupSelectedRef = useRef(false);
  const deliverySelectedRef = useRef(false);

  const [errors, setErrors] = useState({
    pickupLocation: false,
    deliveryLocation: false,
  });

  const navigate = useNavigate();

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

  // Suggestion selection
  const handlePickupSuggestionSelect = (suggestion) => {
    pickupSelectedRef.current = true;
    setPickupQuery(suggestion.description);
    setPickup({ ...pickup, location: suggestion.description });
    setPickupSuggestions([]);
    setFocusedPickupIndex(-1);
    setErrors(prev => ({ ...prev, pickupLocation: false }));
  };

  const handleDeliverySuggestionSelect = (suggestion) => {
    deliverySelectedRef.current = true;
    setDeliveryQuery(suggestion.description);
    setDelivery({ ...delivery, location: suggestion.description });
    setDeliverySuggestions([]);
    setFocusedDeliveryIndex(-1);
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

  // Submit with validation
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {
      pickupLocation: pickupQuery.trim() === '',
      deliveryLocation: deliveryQuery.trim() === '',
    };

    setErrors(newErrors);

    if (!newErrors.pickupLocation && !newErrors.deliveryLocation) {
      navigate('/items');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Where are you moving from and to?" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">

              {/* Pickup Section */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Pickup Details</h2>

                {/* Pickup input */}
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
                      className={`w-full px-4 py-2 border ${
                        errors.pickupLocation ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter pickup address"
                    />
                    {pickupSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
                        {pickupSuggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            onClick={() => handlePickupSuggestionSelect(suggestion)}
                            className={`px-4 py-2 cursor-pointer ${
                              idx === focusedPickupIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                          >
                            {suggestion.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.pickupLocation && <p className="text-red-600 text-sm mt-1">Pickup address is required</p>}
                </div>

                {/* Floor selection */}
                <div className="mb-4">
                  <label className="block mb-1">Floor</label>
                  <select
                    value={pickup.floor}
                    onChange={(e) => setPickup({ ...pickup, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  >
                    <option>Ground floor</option>
                    <option>1st floor</option>
                    <option>2nd floor</option>
                    <option>3rd floor</option>
                    <option>4th floor</option>
                    <option>5th floor +</option>
                  </select>
                </div>

                {/* Lift */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pickupLift"
                    checked={pickup.liftAvailable}
                    onChange={(e) => setPickup({ ...pickup, liftAvailable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="pickupLift" className="ml-2">Lift Available</label>
                </div>
              </div>

              {/* Delivery Section */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Delivery Details</h2>

                {/* Delivery input */}
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
                      className={`w-full px-4 py-2 border ${
                        errors.deliveryLocation ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter delivery address"
                    />
                    {deliverySuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
                        {deliverySuggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleDeliverySuggestionSelect(suggestion)}
                            className={`px-4 py-2 cursor-pointer ${
                              idx === focusedDeliveryIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                          >
                            {suggestion.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.deliveryLocation && <p className="text-red-600 text-sm mt-1">Delivery address is required</p>}
                </div>

                {/* Floor selection */}
                <div className="mb-4">
                  <label className="block mb-1">Floor</label>
                  <select
                    value={delivery.floor}
                    onChange={(e) => setDelivery({ ...delivery, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  >
                    <option>Ground floor</option>
                    <option>1st floor</option>
                    <option>2nd floor</option>
                    <option>3rd floor</option>
                    <option>4th floor</option>
                    <option>5th floor +</option>
                  </select>
                </div>

                {/* Lift */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="deliveryLift"
                    checked={delivery.liftAvailable}
                    onChange={(e) => setDelivery({ ...delivery, liftAvailable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="deliveryLift" className="ml-2">Lift Available</label>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="p-6 flex justify-between items-center">
                <button
                  type="button"
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Add an extra stop
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next Step
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

export default LocationForm;
