import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import axios from 'axios';
import AdditionalServices from './AdditionalServices';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// List of UK cities for validation
const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Sheffield",
  "Bradford", "Liverpool", "Bristol", "Coventry", "Leicester",
  "Nottingham", "Newcastle upon Tyne", "Sunderland", "Derby", "Plymouth",
  "Wolverhampton", "Southampton", "Stoke-on-Trent", "Reading", "Brighton & Hove",
  "Milton Keynes", "Northampton", "Luton", "Exeter", "York",
  "Cambridge", "Oxford", "Norwich", "Bournemouth", "Poole",
  "Swindon", "Peterborough", "Southend-on-Sea", "Bath", "Ipswich",
  "Blackpool", "Middlesbrough", "Huddersfield", "Hull", "Preston",
  "Portsmouth", "Slough", "Warrington", "Cheltenham", "Gloucester",
  "Worthing", "Doncaster", "Rotherham", "Colchester", "Crawley",
  "Lincoln", "Chester", "Canterbury", "Lancaster", "Wakefield",
  "Barnsley", "Stockport", "Wigan", "Oldham", "Bolton",
  "Rochdale", "Salford", "Telford", "Blackburn", "Burnley",
  "Grimsby", "Mansfield", "Bedford", "Hastings", "Chelmsford",
  "Dudley", "Weston-super-Mare", "Salisbury", "Worcester", "Hereford",
  "St Albans", "Winchester", "Chichester", "Durham", "Carlisle",
  "Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness",
  "Stirling", "Perth", "Dunfermline", "Ayr", "Kilmarnock",
  "Paisley", "Greenock", "Livingston", "Falkirk", "Motherwell",
  "Hamilton", "Cumbernauld", "Kirkcaldy", "Glenrothes", "Dumfries",
  "Cardiff", "Swansea", "Newport", "Wrexham", "Bangor",
  "St Asaph", "St Davids", "Aberystwyth", "Carmarthen", "Caernarfon",
  "Llandudno", "Bridgend", "Merthyr Tydfil", "Rhyl", "Barry",
  "Belfast", "Derry", "Lisburn", "Newry", "Armagh",
  "Bangor", "Craigavon", "Ballymena", "Omagh", "Enniskillen"
];

const BookingDetails = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [phoneErrors, setPhoneErrors] = useState({
    customer: '',
    pickup: '',
    delivery: ''
  });

  const [showTermsModal, setShowTermsModal] = useState(false);


  const [contactNameErrors, setContactNameErrors] = useState({
    pickup: '',
    delivery: '',
    customer: ''
  });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isBookingCreating, setIsBookingCreating] = useState(false);

  // State for auto-fetch functionality
  const [isPickupFetching, setIsPickupFetching] = useState(false);
  const [isDeliveryFetching, setIsDeliveryFetching] = useState(false);
  const [pickupPostcodeTimer, setPickupPostcodeTimer] = useState(null);
  const [deliveryPostcodeTimer, setDeliveryPostcodeTimer] = useState(null);

  const {
    customerDetails,
    setCustomerDetails,
    pickup,
    setPickup,
    delivery,
    setDelivery,
    selectedDate,
    journey,
    totalPrice,
    items,
    motorBike,
    piano,
    quoteRef,
    setQuoteRef,
    van,
    extraStops,
    itemsToAssemble,
    itemsToDismantle,
    bookingRef, setBookingRef,
    additionalServices,
    quoteDetails, setQuoteDetails,
    service
  } = useBooking();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');

  const validateTermsAndConditions = () => {
    if (!termsAccepted) {
      setTermsError('You must accept the Terms and Conditions to proceed');
      return false;
    }
    setTermsError('');
    return true;
  };


  // Validate UK mobile number
  const validateUKPhoneNumber = (phone) => {
    const regex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
    return regex.test(phone);
  };

  // Unified address parser that works for both scenarios
  const parseAddressComponents = (fullAddress) => {
    if (!fullAddress) return { addressLine1: '', addressLine2: '', city: '' };

    // Clean the input
    const cleaned = fullAddress
      .replace(/\bUK\b/i, '')
      .replace(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/g, '')
      .trim();

    // Split into parts
    const parts = cleaned.split(',')
      .map(part => part.trim())
      .filter(part => part !== '');

    // Find city (exact match only)
    let city = '';

    // Check each part for a city match
    const filteredParts = parts.filter(part => {
      const matchedCity = UK_CITIES.find(c =>
        c.toLowerCase() === part.toLowerCase()
      );
      if (matchedCity) {
        city = matchedCity; // Store the matched city
        return false; // Remove this part from address lines
      }
      return true; // Keep this part in address lines
    });

    return {
      addressLine1: filteredParts[0] || "",
      addressLine2: filteredParts[1] || "",
      city: city
    };
  };

  // Auto-fetch pickup address when postcode changes
  const handlePickupPostcodeChange = (postcode) => {
    setPickup(prev => ({ ...prev, postcode }));

    // Clear previous timer
    if (pickupPostcodeTimer) {
      clearTimeout(pickupPostcodeTimer);
    }

    // Set new timer for debounced API call
    if (postcode.trim().length >= 3) {
      const timer = setTimeout(async () => {
        setIsPickupFetching(true);
        try {
          const response = await axios.post(`${baseUrl}/autocomplete`, {
            place: postcode
          });

          const predictions = response.data.predictions || [];
          if (predictions.length > 0) {
            // Automatically select the first result
            const firstResult = predictions[0];
            const { addressLine1, addressLine2, city } = parseAddressComponents(firstResult.description);

            setPickup(prev => ({
              ...prev,
              addressLine1,
              addressLine2,
              city,
              location: firstResult.description,
            }));
          }
        } catch (error) {
          console.error('Error fetching pickup address:', error);
        } finally {
          setIsPickupFetching(false);
        }
      }, 500); // 500ms delay for better UX

      setPickupPostcodeTimer(timer);
    }
  };

  // Auto-fetch delivery address when postcode changes
  const handleDeliveryPostcodeChange = (postcode) => {
    setDelivery(prev => ({ ...prev, postcode }));

    // Clear previous timer
    if (deliveryPostcodeTimer) {
      clearTimeout(deliveryPostcodeTimer);
    }

    // Set new timer for debounced API call
    if (postcode.trim().length >= 3) {
      const timer = setTimeout(async () => {
        setIsDeliveryFetching(true);
        try {
          const response = await axios.post(`${baseUrl}/autocomplete`, {
            place: postcode
          });

          const predictions = response.data.predictions || [];
          if (predictions.length > 0) {
            // Automatically select the first result
            const firstResult = predictions[0];
            const { addressLine1, addressLine2, city } = parseAddressComponents(firstResult.description);

            setDelivery(prev => ({
              ...prev,
              addressLine1,
              addressLine2,
              city,
              location: firstResult.description,
            }));
          }
        } catch (error) {
          console.error('Error fetching delivery address:', error);
        } finally {
          setIsDeliveryFetching(false);
        }
      }, 500); // 500ms delay for better UX

      setDeliveryPostcodeTimer(timer);
    }
  };




  const saveData = () => {
    localStorage.setItem('dateToken', selectedDate.date);
    localStorage.setItem('timeToken', selectedDate.pickupTime);
    localStorage.setItem('workerToken', selectedDate.numberOfMovers);
    console.log('Data stored in localStorage');
  };





  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pickupPostcodeTimer) clearTimeout(pickupPostcodeTimer);
      if (deliveryPostcodeTimer) clearTimeout(deliveryPostcodeTimer);
    };
  }, [pickupPostcodeTimer, deliveryPostcodeTimer]);

  // For initial address parsing (from previous steps)
  useEffect(() => {
    if (pickup.location && !pickup.addressLine1) {
      const { addressLine1, addressLine2, city } = parseAddressComponents(pickup.location);
      setPickup(prev => ({
        ...prev,
        addressLine1,
        addressLine2,
        city
      }));
    }
  }, [pickup.location]);

  useEffect(() => {
    if (delivery.location && !delivery.addressLine1) {
      const { addressLine1, addressLine2, city } = parseAddressComponents(delivery.location);
      setDelivery(prev => ({
        ...prev,
        addressLine1,
        addressLine2,
        city
      }));
    }
  }, [delivery.location]);

  //for add extra stop
  useEffect(() => {
    console.log('Current extraStops:', extraStops);
  }, [extraStops]);

  // Validate all phone numbers before submission
  const validateAllPhones = () => {
    const errors = {
      customer: validateUKPhoneNumber(customerDetails.phone) ? '' : 'Enter a valid UK mobile number: 07 (11 digits) or +447 format',
      pickup: validateUKPhoneNumber(pickup.contactPhone) ? '' : 'Enter a valid UK mobile number: 07 (11 digits) or +447 format',
      delivery: validateUKPhoneNumber(delivery.contactPhone) ? '' : 'Enter a valid UK mobile number: 07 (11 digits) or +447 format'
    };

    setPhoneErrors(errors);

    return !errors.customer && !errors.pickup && !errors.delivery;
  };

  const validateContactNames = () => {
    const errors = {
      pickup: pickup.contactName?.trim() ? '' : 'Contact name is required',
      delivery: delivery.contactName?.trim() ? '' : 'Contact name is required',
      customer: customerDetails.name?.trim() ? '' : 'Contact name is required',
    };

    setContactNameErrors(errors);
    return !errors.pickup && !errors.delivery && !errors.customer;
  };

  const validateExtraStops = (stops) => {
    if (!Array.isArray(stops) || stops.length === 0) return [];

    return stops.map(stop => ({
      ...stop,
      // Ensure doorNumber exists and is a string
      doorNumber: stop.doorNumber || stop.doorFlatNo || '',
      // Ensure lift exists and is a boolean
      lift: typeof stop.lift === 'boolean' ? stop.lift : Boolean(stop.liftAvailable),
    }));
  };

  const validateItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return items.map(items => ({
      ...items,
      name: items.name || '',
      // Ensure quantity exists and is a number
      quantity: items.quantity || 0,
    }))
  }

  const handleQuoteSubmit = async () => {
    setIsSuccess(true);
    setSubmitError(null);
    setEmailError(null);

    try {
      if (!quoteRef) {
        setSubmitError('No quotation reference found. Please try booking again.');
        return;
      }

      const quoteEmailResponse = await axios.get(`${baseUrl}/quote/mail/${quoteRef}`);
      console.log("Quote email response:", quoteEmailResponse.data);

      // setShowBookingModal(false);
      navigate('/quote-confirmation');

    } catch (emailError) {
      console.error('Error sending quote email:', emailError);
      setEmailError('Failed to send quote email. Please try again.');
    } finally {
      setIsSuccess(false);
    }
  };



  const handleBookingCreation = async () => {
    const termsValid = validateTermsAndConditions();
    const phonesValid = validateAllPhones();
    const contactNamesValid = validateContactNames();

    if (!termsValid || !phonesValid || !contactNamesValid) {
      setSubmitError('Please correct the errors above');
      return false;
    }

    // if (quoteRef) {
    //   console.log('Quote reference already exists:', quoteRef);
    //   return true;
    // }

    setIsBookingCreating(true);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const validatedStops = validateExtraStops(extraStops);

      let quotationRef;

      if (quoteRef) {
        // Update existing quote
        console.log('Updating existing quote:', quoteRef);

        const updateData = {
          quotationRef: quoteRef,
          // worker: selectedDate.numberOfMovers || 1,
          // Add any other fields you want to update
          username: customerDetails.name || 'NA',
          email: quoteDetails.email || 'NA',
          phoneNumber: customerDetails.phone || 'NA',
          // ... rest of your existing quoteData object
          price: totalPrice || 0,
          distance: parseInt(journey.distance) || 0,
          route: "default route",
          duration: journey.duration || "N/A",
          pickupDate: selectedDate.date || 'NA',
          pickupTime: selectedDate.pickupTime || '08:00:00',
          pickupAddress: {
            postcode: pickup.postcode,
            addressLine1: pickup.addressLine1,
            addressLine2: pickup.addressLine2,
            city: pickup.city,
            country: pickup.country,
            contactName: pickup.contactName,
            contactPhone: pickup.contactPhone,
          },
          dropDate: selectedDate.date || 'NA',
          dropTime: selectedDate.dropTime || '18:00:00',
          dropAddress: {
            postcode: delivery.postcode,
            addressLine1: delivery.addressLine1,
            addressLine2: delivery.addressLine2,
            city: delivery.city,
            country: delivery.country,
            contactName: delivery.contactName,
            contactPhone: delivery.contactPhone,
          },
          vanType: van.type || "Small",
          worker: selectedDate.numberOfMovers,
          itemsToDismantle: itemsToDismantle || 0,
          itemsToAssemble: itemsToAssemble || 0,
          stoppage: validatedStops,
          pickupLocation: {
            location: pickup.location || "N/A",
            floor: typeof pickup.floor === 'string' ? parseInt(pickup.floor) : pickup.floor,
            lift: pickup.liftAvailable,
            propertyType: pickup.propertyType || "standard"
          },
          dropLocation: {
            location: delivery.location || "N/A",
            floor: typeof delivery.floor === 'string' ? parseInt(delivery.floor) : delivery.floor,
            lift: delivery.liftAvailable,
            propertyType: delivery.propertyType || "standard"
          },
          details: {
            service: service || '',
            items: {
              name: items.map(item => item.name) || [],
              quantity: items.map(item => item.quantity) || [],
            },
            isBusinessCustomer: customerDetails.isBusinessCustomer,
            motorBike: motorBike.type,
            piano: piano.type,
            specialRequirements: additionalServices.specialRequirements,
            pickupFlatNo: pickup.flatNo,
            dropFlatno: delivery.flatNo
          },
        };

        console.log("Booking Data (updated) being sent:", JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.put(`${baseUrl}/quote/update`, updateData);
        quotationRef = quoteRef; // Use existing reference
        console.log("Quote updated successfully: ", updateResponse);

      } else {
        // Create new quote
        console.log('Creating new quote');

        const quoteData = {
          username: customerDetails.name || 'NA',
          email: quoteDetails.email || 'NA',
          phoneNumber: customerDetails.phone || 'NA',
          // ... rest of your existing quoteData object
          price: totalPrice || 0,
          distance: parseInt(journey.distance) || 0,
          route: "default route",
          duration: journey.duration || "N/A",
          pickupDate: selectedDate.date || 'NA',
          pickupTime: selectedDate.pickupTime || '08:00:00',
          pickupAddress: {
            postcode: pickup.postcode,
            addressLine1: pickup.addressLine1,
            addressLine2: pickup.addressLine2,
            city: pickup.city,
            country: pickup.country,
            contactName: pickup.contactName,
            contactPhone: pickup.contactPhone,
          },
          dropDate: selectedDate.date || 'NA',
          dropTime: selectedDate.dropTime || '18:00:00',
          dropAddress: {
            postcode: delivery.postcode,
            addressLine1: delivery.addressLine1,
            addressLine2: delivery.addressLine2,
            city: delivery.city,
            country: delivery.country,
            contactName: delivery.contactName,
            contactPhone: delivery.contactPhone,
          },
          vanType: van.type || "Small",
          worker: selectedDate.numberOfMovers,
          itemsToDismantle: itemsToDismantle || 0,
          itemsToAssemble: itemsToAssemble || 0,
          stoppage: validatedStops,
          pickupLocation: {
            location: pickup.location || "N/A",
            floor: typeof pickup.floor === 'string' ? parseInt(pickup.floor) : pickup.floor,
            lift: pickup.liftAvailable,
            propertyType: pickup.propertyType || "standard"
          },
          dropLocation: {
            location: delivery.location || "N/A",
            floor: typeof delivery.floor === 'string' ? parseInt(delivery.floor) : delivery.floor,
            lift: delivery.liftAvailable,
            propertyType: delivery.propertyType || "standard"
          },
          details: {
            service: service || '',
            items: {
              name: items.map(item => item.name) || [],
              quantity: items.map(item => item.quantity) || [],
            },
            isBusinessCustomer: customerDetails.isBusinessCustomer,
            motorBike: motorBike.type,
            piano: piano.type,
            specialRequirements: additionalServices.specialRequirements,
            pickupFlatNo: pickup.flatNo,
            dropFlatno: delivery.flatNo
          },
        };

        console.log("Booking Data being sent:", JSON.stringify(quoteData, null, 2));

        const quoteResponse = await axios.post(`${baseUrl}/quote/create`, quoteData);
        quotationRef = quoteResponse.data?.newQuote?.quotationRef;

        if (!quotationRef) {
          throw new Error("Quotation reference not received from server");
        }

        setQuoteRef(quotationRef);
        console.log("New quotation reference created:", quotationRef);
      }

      return true;


    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response) {
        setSubmitError(`Server error: ${error.response.data?.message || error.response.statusText || 'Unknown server error'}`);
      } else if (error.request) {
        setSubmitError('Network error: No response received from server. Please check your internet connection and try again.');
      } else {
        setSubmitError(`Error: ${error.message || 'An unknown error occurred'}`);
      }
      return false;
    } finally {
      setIsSubmitting(false);
      setIsBookingCreating(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError(null);

    if (!quoteRef) {
      setSubmitError('No quotation reference found. Please try booking again.');
      return;
    }



    try {
      const quoteEmailResponse = await axios.get(`${baseUrl}/quote/mail/${quoteRef}`);
      console.log("Quote email response:", quoteEmailResponse.data);


      const sessionRes = await axios.post(`${baseUrl}/create-checkout-session`, {
        quotationRef: quoteRef || 'NA',
      });

      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: sessionRes.data.sessionId });

    } catch (error) {
      console.error('Error submitting booking:', error);
      setSubmitError('Failed to submit booking. Please try again. (Check all fields are selected or not)');
      console.error('Error response data:', error.response.data);
      navigate('/payment-failed'); // redirect on error

    } finally {
      setIsSubmitting(false);
      // setShowBookingModal(false);
    }
  };

  const handlePickupChange = (field, value) => {
    setPickup({
      ...pickup,
      [field]: value
    });
  };

  const handleDeliveryChange = (field, value) => {
    setDelivery({
      ...delivery,
      [field]: value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* <Header title="Your Booking Details" /> */}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <form onSubmit={(e) => e.preventDefault()} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Booking Details
                </h2>
                <p className="text-blue-100 mt-1">Complete your booking information</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Two Column Layout for Pickup and Delivery */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Pickup Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">Pickup Details</h3>
                    </div>

                    {/* Postcode */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Postcode</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter Postcode"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          value={pickup.postcode || ''}
                          onChange={(e) => handlePickupPostcodeChange(e.target.value)}
                        />
                        {isPickupFetching && (
                          <div className="absolute right-3 top-3 text-blue-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {isPickupFetching && (
                        <div className="text-blue-600 text-sm">Fetching address...</div>
                      )}
                    </div>

                    {/* Address Fields in Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Flat No.</label>
                        <input
                          type="text"
                          placeholder="Flat No/Door No"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          value={pickup.flatNo || ''}
                          onChange={(e) => setPickup({ ...pickup, flatNo: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          value={pickup.city || ''}
                          onChange={(e) => setPickup({ ...pickup, city: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        value={pickup.addressLine1 || ''}
                        onChange={(e) => setPickup({ ...pickup, addressLine1: e.target.value })}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        value={pickup.addressLine2 || ''}
                        onChange={(e) => setPickup({ ...pickup, addressLine2: e.target.value })}
                      />
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700">Contact Details</h4>
                      <input
                        type="text"
                        placeholder="Contact Name at Pickup"
                        className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${contactNameErrors.pickup ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                          }`}
                        value={pickup.contactName || ''}
                        onChange={(e) => {
                          setCustomerDetails({ ...customerDetails, name: e.target.value });
                          handlePickupChange('contactName', e.target.value);
                        }}
                        required
                      />
                      {contactNameErrors.pickup && (
                        <div className="text-red-500 text-xs mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {contactNameErrors.pickup}
                        </div>
                      )}
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="Pickup Contact Number (UK mobile)"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${phoneErrors.pickup ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                          value={pickup.contactPhone || ''}
                          onChange={(e) => {
                            setCustomerDetails({ ...customerDetails, phone: e.target.value });
                            handlePickupChange('contactPhone', e.target.value)
                          }}
                          required
                        />
                        {phoneErrors.pickup && (
                          <div className="text-red-500 text-xs mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {phoneErrors.pickup}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">Delivery Details</h3>
                    </div>

                    {/* Postcode */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Postcode</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter Postcode"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          value={delivery.postcode || ''}
                          onChange={(e) => handleDeliveryPostcodeChange(e.target.value)}
                        />
                        {isDeliveryFetching && (
                          <div className="absolute right-3 top-3 text-blue-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {isDeliveryFetching && (
                        <div className="text-blue-600 text-sm">Fetching address...</div>
                      )}
                    </div>

                    {/* Address Fields in Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Flat No.</label>
                        <input
                          type="text"
                          placeholder="Flat No/Door No"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          value={delivery.flatNo || ''}
                          onChange={(e) => setDelivery({ ...delivery, flatNo: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          value={delivery.city || ''}
                          onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        value={delivery.addressLine1 || ''}
                        onChange={(e) => setDelivery({ ...delivery, addressLine1: e.target.value })}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        value={delivery.addressLine2 || ''}
                        onChange={(e) => setDelivery({ ...delivery, addressLine2: e.target.value })}
                      />
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700">Contact Details</h4>
                      <input
                        type="text"
                        placeholder="Contact Name at Delivery"
                        className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${contactNameErrors.delivery ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                          }`}
                        value={delivery.contactName || ''}
                        onChange={(e) => handleDeliveryChange('contactName', e.target.value)}
                        required
                      />
                      {contactNameErrors.delivery && (
                        <div className="text-red-500 text-xs mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {contactNameErrors.delivery}
                        </div>
                      )}
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="Delivery Contact Number (UK mobile)"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${phoneErrors.delivery ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                          value={delivery.contactPhone || ''}
                          onChange={(e) => handleDeliveryChange('contactPhone', e.target.value)}
                          required
                        />
                        {phoneErrors.delivery && (
                          <div className="text-red-500 text-xs mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {phoneErrors.delivery}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Contact Details Section */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">Your Contact Details</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        value={customerDetails.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          // setPickup({ ...pickup, contactName: newName });
                          setCustomerDetails({ ...customerDetails, name: newName });
                        }}
                        className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${contactNameErrors.customer ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                          }`}
                        placeholder="Enter your full name"
                        required
                      />
                      {contactNameErrors.customer && (
                        <div className="text-red-500 text-xs mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {contactNameErrors.customer}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={quoteDetails.email}
                        onChange={(e) => {
                          const newEmail = e.target.value;
                          setQuoteDetails({ ...quoteDetails, email: newEmail });
                          setCustomerDetails({ ...customerDetails, email: newEmail });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/70"
                        placeholder="Enter your email address"
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1">We'll send your booking confirmation here</div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number (UK mobile)</label>
                      <input
                        type="tel"
                        id="phone"
                        value={customerDetails.phone}
                        onChange={(e) => {
                          const newPhone = e.target.value;
                          // setPickup({ ...pickup, contactPhone: newPhone });
                          setCustomerDetails({ ...customerDetails, phone: newPhone });
                        }}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all duration-200 bg-white/70 ${phoneErrors.customer ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                        placeholder="Enter your UK mobile number"
                        required
                      />
                      {phoneErrors.customer && (
                        <div className="text-red-500 text-xs mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {phoneErrors.customer}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">We'll use this to contact you about your move</div>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center space-x-2 cursor-pointer bg-white/70 px-3 py-2 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          id="businessCustomer"
                          checked={customerDetails.isBusinessCustomer}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, isBusinessCustomer: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">I am a business customer</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Booking Summary
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <div className="font-medium text-gray-700">Moving from:</div>
                      <div className="text-gray-600 text-right">Flat no-{pickup.flatNo}, {pickup.location}</div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <div className="font-medium text-gray-700">Moving to:</div>
                      <div className="text-gray-600 text-right">Flat no-{delivery.flatNo}, {delivery.location}</div>
                    </div>

                    {extraStops.map((stop, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div className="font-medium text-gray-700">Extra Stop:</div>
                        <div className="text-gray-600 text-right">Flat no-{stop.doorFlatNo}, {stop.address}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (e.target.checked) {
                          setTermsError(''); // Clear error when checked
                        }
                      }}
                      className={`h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${termsError ? 'border-red-500' : ''
                        }`}
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                      I agree to the
                      <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-600 hover:underline font-medium ml-1">
                        Read Terms and Conditions
                      </button>

                    </label>
                  </div>

                  {/* Add error message for terms */}
                  {termsError && (
                    <div className="text-red-500 text-xs mt-1 flex items-center ml-6">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {termsError}
                    </div>
                  )}

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="marketing"
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="marketing" className="ml-2 block text-sm text-gray-700">
                      I would like to receive marketing communications with special offers and news
                    </label>
                  </div>
                </div>

                {/* Error message if submission fails */}
                {submitError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {submitError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate('/additional-services')}
                    className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    disabled={isSubmitting}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>

                  {/* Book Now Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await handleBookingCreation();
                      if (success) {
                        setShowBookingModal(true);
                      }
                    }}
                    className="flex items-center space-x-2 px-8 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl transform hover:-translate-y-0.5 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isBookingCreating || isSubmitting}
                  >
                    {isBookingCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Book Now</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>



                {/* Privacy Notice */}
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                  <p className="mb-2"><strong>Privacy Notice:</strong></p>
                  <p>It is your responsibility to make contact persons aware that Reliance and a driver will contact them during the course of the job. By clicking 'Pay Now' you are authorizing Reliance to share essential booking information with these persons and a driver.</p>
                </div>
              </div>
            </form>
          </div>

          <div className="lg:w-1/3">
            <OrderSummary />
          </div>
        </div>
      </div>
      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Complete Your Booking
                </h3>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setEmailError(null); // ADD THIS LINE
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-2">Choose how you'd like to proceed</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-gray-800 mb-2">£{totalPrice}</div>
                <p className="text-gray-600">Total booking amount</p>
              </div>

              {emailError && (
                <div className="p-3 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </div>
              )}

              {/* Send Quotation Button */}
              <button
                type="button"
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-medium shadow-lg transition-all duration-200 ${isSuccess
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl'
                  } text-white`}
                disabled={isSuccess}
                onClick={(e) => {
                  // Add send quotation functionality here later
                  console.log('Send quotation clicked');
                  handleQuoteSubmit(e);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
                </svg>
                <span>{isSuccess ? 'Sending Quotation...' : 'Send Quote'}</span>
              </button>

              {/* Pay Now Button */}
              <button
                type="button"
                onClick={(e) => {

                  handlePaymentSubmit(e);
                  // setShowBookingModal(false);
                }}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-medium shadow-lg transition-all duration-200 ${isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl'
                  } text-white`}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Processing Payment...' : 'Pay Now'}</span>
                {!isSubmitting && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  setShowBookingModal(false);
                  setEmailError(null); // ADD THIS LINE
                }}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4">Terms and Conditions</h2>
            <div className="space-y-4 text-sm text-gray-700 max-h-72 overflow-y-auto pr-2">
  <p><strong>RELIANCEMOVE LTD</strong> is a registered limited company in England (Company No: 16429125), operating from Unit 19, LONGHAYES AVENUE, ROMFORD, RM6 5HB.</p>

  <p>Reliancemove operates a booking platform for individuals, groups, or corporate bodies to get affordable quotes for removal jobs and book services if satisfied.</p>

  <p><strong>Before booking</strong>, please read our terms carefully as they define who we are and what we offer. Services are subject to booking confirmation and driver availability.</p>

  <h4 className="font-semibold text-gray-800">QUOTATIONS AND PAYMENTS</h4>
  <ul className="list-disc list-inside space-y-1">
    <li>Quotes are based on provided information; changes may result in revised quotes.</li>
    <li>All payment terms must be agreed upon before the service date.</li>
    <li>Full payment is due at the time of booking; confirmation email will follow.</li>
    <li>Additional charges may apply for delays caused by incorrect info or access issues.</li>
  </ul>

  <h4 className="font-semibold text-gray-800">BOOKING AND CANCELLATION</h4>
  <ul className="list-disc list-inside space-y-1">
    <li>Bookings must be confirmed via email or text.</li>
    <li>Full refund available if cancellation occurs within 2 hours of booking.</li>
    <li>Rescheduling must be requested at least 48 hours in advance and is subject to availability.</li>
    <li>A booking is considered serviced once the trip from pickup to delivery is completed.</li>
  </ul>

  <h4 className="font-semibold text-gray-800">CUSTOMER RESPONSIBILITIES</h4>
  <ul className="list-disc list-inside space-y-1">
    <li>Ensure all items are packed securely unless packing service is included.</li>
    <li>Declare and label all fragile or valuable items.</li>
    <li>Arrange parking and permits at both pickup and delivery locations.</li>
    <li>Be present or assign an authorized representative at both ends.</li>
  </ul>

  <h4 className="font-semibold text-gray-800">LIMITATION AND LIABILITY</h4>
  <ul className="list-disc list-inside space-y-1">
    <li>Not liable for damage to items not packed by us unless due to negligence.</li>
    <li>Not responsible for delays caused by weather, traffic, or external factors.</li>
    <li>Drivers are vetted; proven negligence is covered by driver’s insurance.</li>
  </ul>

  <h4 className="font-semibold text-gray-800">INSURANCE</h4>
  <p>Claims must be made within 7 days directly to the driver’s insurance company.</p>

  <h4 className="font-semibold text-gray-800">EXCLUDED ITEMS</h4>
  <ul className="list-disc list-inside space-y-1">
    <li>Hazardous materials, illegal items, perishable goods, and animals are not allowed.</li>
    <li>Drivers may refuse to move items deemed unsafe or illegal.</li>
  </ul>

  <h4 className="font-semibold text-gray-800">ACCESS AND DELAYS</h4>
  <ul className="list-disc list-inside space-y-1">
    <li>Provide clear access at both pickup and delivery points.</li>
    <li>Charges may apply for delays caused by poor access or customer issues.</li>
  </ul>

  <h4 className="font-semibold text-gray-800">DISPUTES AND GOVERNING LAW</h4>
  <ul className="list-disc list-inside space-y-1">
    <li>Disputes are handled in accordance with local consumer laws.</li>
    <li>These terms are governed by the laws of the United Kingdom.</li>
  </ul>
</div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl font-medium shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl transform hover:-translate-y-0.5 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingDetails;