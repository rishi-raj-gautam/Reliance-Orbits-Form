import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import axios from "axios";
import ExtraStopModal from '../components/ExtraStopModal';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const PianoLocationForm = () => {
  const navigate = useNavigate();
  const {
    pickup,
    setPickup,
    delivery,
    setDelivery,
    items,
    setItems,
    addItem,
    updateItemQuantity,
    removeItem,
    pickupAddressWithPostalCode,
    setpickupAddressWithPostalCode,
    dropAddressWithPostalCode,
    setdropAddressWithPostalCode,
    extraStops,
    setExtraStops,
    service, setService
  } = useBooking();

  // State for address inputs and autocomplete
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
  const [pickupSelecting, setPickupSelecting] = useState(false);
  const [deliverySelecting, setDeliverySelecting] = useState(false);

  // State for selected piano type
  const [selectedPianoType, setSelectedPianoType] = useState('');

  // For extra stop modal
  const [isExtraStopModalOpen, setIsExtraStopModalOpen] = useState(false);

  // Constants
  const floorOptions = [
    "Ground floor", "1st floor", "2nd floor", "3rd floor", "4th floor", "5th floor +"
  ];

  const pianoTypes = [
    "Upright Piano", "Baby Grand Piano", "Grand Piano",
    "Digital Piano", "Electric Piano", "Console Piano"
  ];

  // Check if piano is already in items and set initial state
  useEffect(() => {
    const existingPiano = items.find(item =>
      pianoTypes.includes(item.name)
    );
    if (existingPiano) {
      setSelectedPianoType(existingPiano.name);
    }
  }, [items]);

  // Handle piano type selection
  const handlePianoTypeChange = (pianoType) => {
    // Remove any existing piano from items
    // setItems([]);

    // Add new piano type to items
    if (pianoType) {
      setItems([{ name: pianoType, quantity: 1 }]);
      // addItem(pianoType);
      setSelectedPianoType(pianoType);
    } else {
      setItems([]);
      setSelectedPianoType('');
    }
  };

  // Utility functions
  const containsUKPostalCode = (str) => {
    const ukPostcodeRegex = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/i;
    return ukPostcodeRegex.test(str);
  };

  const containsUK = (str) => {
    return str.trim().endsWith("UK") || str.trim().endsWith("UK,");
  };

  const formatAddressWithPostcode = (address, postcode) => {
    let cleanAddress = address;
    if (containsUK(cleanAddress)) {
      cleanAddress = cleanAddress.replace(/,?\s*UK,?$/, '');
    }

    if (!containsUKPostalCode(cleanAddress)) {
      return `${cleanAddress} ${postcode}, UK`;
    } else {
      return containsUK(cleanAddress) ? cleanAddress : `${cleanAddress}, UK`;
    }
  };

   useEffect(()=>{
    setService("Piano Removal");
    console.log(service);

  },[setService])

  // Validation functions
  const validatePickupAddress = () => {
    if (!pickupQuery.trim()) {
      setPickupError('Please enter your pickup location');
      return false;
    }
    if (!pickupPlaceId) {
      setPickupError('Please select a valid pickup location from suggestions');
      return false;
    }
    setPickupError('');
    return true;
  };

  const validateDeliveryAddress = () => {
    if (!deliveryQuery.trim()) {
      setDeliveryError('Please enter your delivery location');
      return false;
    }
    if (!deliveryPlaceId) {
      setDeliveryError('Please select a valid delivery location from suggestions');
      return false;
    }
    setDeliveryError('');
    return true;
  };

  // Autocomplete effects
  useEffect(() => {
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

  useEffect(() => {
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

  // Postal code effects
  useEffect(() => {
    if (!pickupPlaceId) return;

    getPostalCode(pickupPlaceId).then((res) => {
      setPickup(prev => {
        const formattedAddress = formatAddressWithPostcode(prev.location, res.data.long_name);
        setPickupSelecting(true);
        setPickupQuery(formattedAddress);
        setTimeout(() => setPickupSelecting(false), 100);
        setpickupAddressWithPostalCode(formattedAddress);
        return { ...prev, postcode: res.data.long_name, location: formattedAddress };
      });
    });
  }, [pickupPlaceId]);

  useEffect(() => {
    if (!deliveryPlaceId) return;

    getPostalCode(deliveryPlaceId).then((res) => {
      setDelivery(prev => {
        const formattedAddress = formatAddressWithPostcode(prev.location, res.data.long_name);
        setDeliverySelecting(true);
        setDeliveryQuery(formattedAddress);
        setTimeout(() => setDeliverySelecting(false), 100);
        setdropAddressWithPostalCode(formattedAddress);
        return { ...prev, postcode: res.data.long_name, location: formattedAddress };
      });
    });
  }, [deliveryPlaceId]);

  // Helper functions
  async function getPostalCode(place_id) {
    const response = await axios.get(`${baseUrl}/postalcode/${place_id}`);
    return response;
  }

  const handlePickupSuggestionSelect = (suggestion) => {
    setPickupSelecting(true);
    setPickupQuery(suggestion.description);
    setPickup({ ...pickup, location: suggestion.description });
    setPickupPlaceId(suggestion.place_id);
    setPickupSuggestions([]);
    setFocusedPickupIndex(-1);
    setPickupError('');
    setTimeout(() => setPickupSelecting(false), 100);
  };

  const handleDeliverySuggestionSelect = (suggestion) => {
    setDeliverySelecting(true);
    setDeliveryQuery(suggestion.description);
    setDelivery({ ...delivery, location: suggestion.description });
    setDeliveryPlaceId(suggestion.place_id);
    setDeliverySuggestions([]);
    setFocusedDeliveryIndex(-1);
    setDeliveryError('');
    setTimeout(() => setDeliverySelecting(false), 100);
  };

  const handlePickupKeyDown = (e) => {
    if (!pickupSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedPickupIndex(prev => (prev < pickupSuggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedPickupIndex(prev => (prev > 0 ? prev - 1 : pickupSuggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        const index = focusedPickupIndex >= 0 ? focusedPickupIndex : 0;
        if (pickupSuggestions[index]) handlePickupSuggestionSelect(pickupSuggestions[index]);
        break;
      case 'Escape':
        setPickupSuggestions([]);
        break;
      default:
        break;
    }
  };

  const handleDeliveryKeyDown = (e) => {
    if (!deliverySuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedDeliveryIndex(prev => (prev < deliverySuggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedDeliveryIndex(prev => (prev > 0 ? prev - 1 : deliverySuggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        const index = focusedDeliveryIndex >= 0 ? focusedDeliveryIndex : 0;
        if (deliverySuggestions[index]) handleDeliverySuggestionSelect(deliverySuggestions[index]);
        break;
      case 'Escape':
        setDeliverySuggestions([]);
        break;
      default:
        break;
    }
  };

  const handlePickupInputChange = (e) => {
    setPickupQuery(e.target.value);
    setPickupSelecting(false);
    if (e.target.value.trim() === '') {
      setPickupError('Please enter your pickup location');
    } else {
      setPickupError('');
    }
  };

  const handleDeliveryInputChange = (e) => {
    setDeliveryQuery(e.target.value);
    setDeliverySelecting(false);
    if (e.target.value.trim() === '') {
      setDeliveryError('Please enter your delivery location');
    } else {
      setDeliveryError('');
    }
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const isPickupValid = validatePickupAddress();
    const isDeliveryValid = validateDeliveryAddress();

    if (!isPickupValid || !isDeliveryValid) {
      return;
    }

    if (!selectedPianoType) {
      alert('Please select your piano type');
      return;
    }

    navigate('/date');
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    {/* <Header title="Where are you moving from and to?" /> */}

    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Piano Type Selection */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Piano Selection
              </h2>
              <p className="text-blue-100 mt-1">Tell us what type of piano you're moving</p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Piano Type</label>
                <select
                  value={selectedPianoType}
                  onChange={(e) => handlePianoTypeChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  required
                >
                  <option value="" disabled>Select Your Piano Type</option>
                  {pianoTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Moving Locations */}
            <div className="px-6 pb-6">
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
                        onBlur={validatePickupAddress}
                        className={`w-full px-4 py-3 border-2 ${pickupError ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm`}
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
                          id="pickupLift"
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
                        onBlur={validateDeliveryAddress}
                        className={`w-full px-4 py-3 border-2 ${deliveryError ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm`}
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
                          id="deliveryLift"
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
                {/* Commented out as in original
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
                */}
                <div></div>
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

    {/* Commented out as in original
    <ExtraStopModal
      isOpen={isExtraStopModalOpen}
      onClose={() => setIsExtraStopModalOpen(false)}
      onAddStop={(stop) => setExtraStops([...extraStops, stop])}
    />
    */}
  </div>
);
};

export default PianoLocationForm;