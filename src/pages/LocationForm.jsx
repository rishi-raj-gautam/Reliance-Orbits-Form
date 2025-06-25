import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import axios from "axios";
import ExtraStopModal from '../components/ExtraStopModal';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const LocationForm = () => {
  const { pickup, setPickup,
    delivery, setDelivery,
    pickupAddressWithPostalCode,
    setpickupAddressWithPostalCode,
    dropAddressWithPostalCode,
    setdropAddressWithPostalCode,
    extraStops, setExtraStops, service, setService } = useBooking();

  const [pickupQuery, setPickupQuery] = useState(pickup.location || '');
  const [deliveryQuery, setDeliveryQuery] = useState(delivery.location || '');

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState([]);

  const [pickupPlaceId, setPickupPlaceId] = useState('');
  const [deliveryPlaceId, setDeliveryPlaceId] = useState('');

  const [pickupTypingTimeout, setPickupTypingTimeout] = useState(null);
  const [deliveryTypingTimeout, setDeliveryTypingTimeout] = useState(null);

  const [focusedPickupIndex, setFocusedPickupIndex] = useState(-1);
  const [focusedDeliveryIndex, setFocusedDeliveryIndex] = useState(-1);

  const [pickupError, setPickupError] = useState('');
  const [deliveryError, setDeliveryError] = useState('');

  // Track if user is currently selecting from suggestions
  const [pickupSelecting, setPickupSelecting] = useState(false);
  const [deliverySelecting, setDeliverySelecting] = useState(false);

  //for extraStopmodal
  const [isExtraStopModalOpen, setIsExtraStopModalOpen] = useState(false);

  const navigate = useNavigate();

  // Check if a string contains a UK postal code pattern
  const containsUKPostalCode = (str) => {
    // Regex for UK postal code pattern - this is a basic version
    const ukPostcodeRegex = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/i;
    return ukPostcodeRegex.test(str);
  };

  // Check if a string contains "UK" at the end
  const containsUK = (str) => {
    return str.trim().endsWith("UK") || str.trim().endsWith("UK,");
  };

  // Autocomplete for pickup
  useEffect(() => {
    // Don't show suggestions when:
    // 1. The query is empty
    // 2. User just selected an item from suggestions
    if (pickupQuery.trim() === '' || pickupSelecting) {
      setPickupSuggestions([]);
      return;
    }

    if (pickupTypingTimeout) clearTimeout(pickupTypingTimeout);

    const timeout = setTimeout(() => {
      axios.post(`${baseUrl}/autocomplete`, { place: pickupQuery })
        .then(res => {
          setPickupSuggestions(res.data.predictions || []);
          setFocusedPickupIndex(-1);
        })
        .catch(() => setPickupSuggestions([]));
    }, 500);

    setPickupTypingTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [pickupQuery]);

  // Autocomplete for delivery
  useEffect(() => {
    // Don't show suggestions when:
    // 1. The query is empty
    // 2. User just selected an item from suggestions
    if (deliveryQuery.trim() === '' || deliverySelecting) {
      setDeliverySuggestions([]);
      return;
    }

    if (deliveryTypingTimeout) clearTimeout(deliveryTypingTimeout);

    const timeout = setTimeout(() => {
      axios.post(`${baseUrl}/autocomplete`, { place: deliveryQuery })
        .then(res => {
          setDeliverySuggestions(res.data.predictions || []);
          setFocusedDeliveryIndex(-1);
        })
        .catch(() => setDeliverySuggestions([]));
    }, 500);

    setDeliveryTypingTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [deliveryQuery]);

  // Format the address with postal code and UK
  const formatAddressWithPostcode = (address, postcode) => {
    // Remove any trailing UK if present
    let cleanAddress = address;
    if (containsUK(cleanAddress)) {
      cleanAddress = cleanAddress.replace(/,?\s*UK,?$/, '');
    }

    // Add postcode if not already present and format with UK
    if (!containsUKPostalCode(cleanAddress)) {
      return `${cleanAddress} ${postcode}, UK`;
    } else {
      // If it already has a postcode, just ensure it ends with UK
      return containsUK(cleanAddress) ? cleanAddress : `${cleanAddress}, UK`;
    }
  };

  // for address with postal code for pickup
  useEffect(() => {
    if (!pickupPlaceId) return;

    getPostalCode(pickupPlaceId).then((res) => {
      setPickup(prev => {
        const newPickup = { ...prev, postcode: res.data.long_name };

        // Format the address properly
        const formattedAddress = formatAddressWithPostcode(prev.location, res.data.long_name);

        // Update the query in a way that doesn't trigger suggestions
        setPickupSelecting(true);
        setPickupQuery(formattedAddress);
        setTimeout(() => setPickupSelecting(false), 100);

        setpickupAddressWithPostalCode(formattedAddress);
        return { ...newPickup, location: formattedAddress };
      });
    });
  }, [pickupPlaceId]);

  // for address with postal code for delivery
  useEffect(() => {
    if (!deliveryPlaceId) return;

    getPostalCode(deliveryPlaceId).then((res) => {
      setDelivery(prev => {
        const newDelivery = { ...prev, postcode: res.data.long_name };

        // Format the address properly
        const formattedAddress = formatAddressWithPostcode(prev.location, res.data.long_name);

        // Update the query in a way that doesn't trigger suggestions
        setDeliverySelecting(true);
        setDeliveryQuery(formattedAddress);
        setTimeout(() => setDeliverySelecting(false), 100);

        setdropAddressWithPostalCode(formattedAddress);
        return { ...newDelivery, location: formattedAddress };
      });
    });
  }, [deliveryPlaceId]);

   useEffect(()=>{
    setService("Furniture Removal");
    console.log(service);

  },[setService])

  async function getPostalCode(place_id) {
    const response = await axios.get(`${baseUrl}/postalcode/` + place_id);
    return response;
  }

  // Suggestion handlers
  const handlePickupSuggestionSelect = (suggestion) => {
    // Mark that we're selecting something, which will prevent suggestions
    setPickupSelecting(true);

    setPickupQuery(suggestion.description);
    setPickup({ ...pickup, location: suggestion.description });
    setPickupPlaceId(suggestion.place_id);
    setPickupSuggestions([]);
    setFocusedPickupIndex(-1);
    setPickupError('');

    // Reset the selection flag after a short delay to allow state updates
    setTimeout(() => setPickupSelecting(false), 100);
  };

  const handleDeliverySuggestionSelect = (suggestion) => {
    // Mark that we're selecting something, which will prevent suggestions
    setDeliverySelecting(true);

    setDeliveryQuery(suggestion.description);
    setDelivery({ ...delivery, location: suggestion.description });
    setDeliveryPlaceId(suggestion.place_id);
    setDeliverySuggestions([]);
    setFocusedDeliveryIndex(-1);
    setDeliveryError('');

    // Reset the selection flag after a short delay to allow state updates
    setTimeout(() => setDeliverySelecting(false), 100);
  };

  // Keyboard navigation for pickup
  const handlePickupKeyDown = (e) => {
    if (!pickupSuggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedPickupIndex((prev) => (prev < pickupSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedPickupIndex((prev) => (prev > 0 ? prev - 1 : pickupSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const index = focusedPickupIndex >= 0 ? focusedPickupIndex : 0;
      if (pickupSuggestions[index]) {
        handlePickupSuggestionSelect(pickupSuggestions[index]);
      }
    } else if (e.key === 'Escape') {
      setPickupSuggestions([]);
    }
  };

  // Keyboard navigation for delivery
  const handleDeliveryKeyDown = (e) => {
    if (!deliverySuggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedDeliveryIndex((prev) => (prev < deliverySuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedDeliveryIndex((prev) => (prev > 0 ? prev - 1 : deliverySuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const index = focusedDeliveryIndex >= 0 ? focusedDeliveryIndex : 0;
      if (deliverySuggestions[index]) {
        handleDeliverySuggestionSelect(deliverySuggestions[index]);
      }
    } else if (e.key === 'Escape') {
      setDeliverySuggestions([]);
    }
  };

  // Handle manual input change with focus on input field
  const handlePickupInputChange = (e) => {
    setPickupQuery(e.target.value);
    // If the user is typing manually, they're not selecting from suggestions
    setPickupSelecting(false);
  };

  const handleDeliveryInputChange = (e) => {
    setDeliveryQuery(e.target.value);
    // If the user is typing manually, they're not selecting from suggestions
    setDeliverySelecting(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let valid = true;

    if (!pickupQuery.trim()) {
      setPickupError('Pickup address is required');
      valid = false;
    } else {
      setPickupError('');
    }

    if (!deliveryQuery.trim()) {
      setDeliveryError('Delivery address is required');
      valid = false;
    } else {
      setDeliveryError('');
    }

    if (valid) {
      navigate('/items');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ">
      {/* <Header title="Where are you moving from and to?" /> */}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Moving Locations
                </h2>
                <p className="text-blue-100 mt-1">Tell us where you're moving from and to</p>
              </div>

              <div className="p-6">
                {/* Two Column Layout for Pickup and Delivery */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pickup Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">Pickup Location</h3>
                    </div>

                    {/* Pickup Address */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pickupQuery}
                          onChange={handlePickupInputChange}
                          onKeyDown={handlePickupKeyDown}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter pickup address"
                        />
                        <div className="absolute right-3 top-3 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        {pickupSuggestions.length > 0 && !pickupSelecting && (
                          <ul className="absolute z-20 bg-white border-2 border-gray-200 mt-1 rounded-xl w-full shadow-lg max-h-60 overflow-y-auto">
                            {pickupSuggestions.map((s, idx) => (
                              <li
                                key={idx}
                                className={`px-4 py-3 cursor-pointer transition-colors ${
                                  idx === focusedPickupIndex ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => handlePickupSuggestionSelect(s)}
                              >
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  <span className="text-sm">{s.description}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {pickupError && <p className="text-red-500 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {pickupError}
                      </p>}
                    </div>

                    {/* Pickup Floor and Lift in one row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                        <select
                          value={pickup.floor}
                          onChange={(e) => setPickup({ ...pickup, floor: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        >
                          <option>Ground floor</option>
                          <option>1st floor</option>
                          <option>2nd floor</option>
                          <option>3rd floor</option>
                          <option>4th floor</option>
                          <option>5th floor +</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors w-full justify-center">
                          <input
                            type="checkbox"
                            checked={pickup.liftAvailable}
                            onChange={(e) => setPickup({ ...pickup, liftAvailable: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Lift Available</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">Delivery Location</h3>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={deliveryQuery}
                          onChange={handleDeliveryInputChange}
                          onKeyDown={handleDeliveryKeyDown}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter delivery address"
                        />
                        <div className="absolute right-3 top-3 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        {deliverySuggestions.length > 0 && !deliverySelecting && (
                          <ul className="absolute z-20 bg-white border-2 border-gray-200 mt-1 rounded-xl w-full shadow-lg max-h-60 overflow-y-auto">
                            {deliverySuggestions.map((s, idx) => (
                              <li
                                key={idx}
                                className={`px-4 py-3 cursor-pointer transition-colors ${
                                  idx === focusedDeliveryIndex ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => handleDeliverySuggestionSelect(s)}
                              >
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  <span className="text-sm">{s.description}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {deliveryError && <p className="text-red-500 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {deliveryError}
                      </p>}
                    </div>

                    {/* Delivery Floor and Lift in one row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                        <select
                          value={delivery.floor}
                          onChange={(e) => setDelivery({ ...delivery, floor: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        >
                          <option>Ground floor</option>
                          <option>1st floor</option>
                          <option>2nd floor</option>
                          <option>3rd floor</option>
                          <option>4th floor</option>
                          <option>5th floor +</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors w-full justify-center">
                          <input
                            type="checkbox"
                            checked={delivery.liftAvailable}
                            onChange={(e) => setDelivery({ ...delivery, liftAvailable: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Lift Available</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsExtraStopModalOpen(true)}
                    className="flex items-center space-x-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Extra Stop</span>
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span>Continue</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <OrderSummary />
        </div>
      </div>
      
      <ExtraStopModal
        isOpen={isExtraStopModalOpen}
        onClose={() => setIsExtraStopModalOpen(false)}
        onAddStop={(stop) => setExtraStops([...extraStops, stop])}
      />
    </div>
  );
};

export default LocationForm;