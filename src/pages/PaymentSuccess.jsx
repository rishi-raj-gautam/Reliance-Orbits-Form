import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useBooking } from '../context/BookingContext';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const PaymentSuccess = () => {

    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    // window.alert(sessionId);
    // const [local, setLocal] = useState('');

    const navigate = useNavigate();
    const {
        bookingRef, setBookingRef,
        quoteRef, setQuoteRef,
        setCustomerDetails, customerDetails,
        setPickup, pickup,
        setDelivery, delivery,
        setSelectedDate, selectedDate,
        setItems, items,
        setJourney, journey,
        setTotalPrice, totalPrice,
        setVan, van,
        setAdditionalServices, additionalServices,
        extraStops, setExtraStops,
        motorBike, piano, setPiano,
        itemsToAssemble, itemsToDismantle,
        setItemsToAssemble, setItemsToDismantle,
        itemsList, setItemsList,
        quantities, setQuantities,
        setQuoteDetails,quoteDetails,
        service, setService
    } = useBooking();

    // let called = false;
    // const [effectCalled, setEffectCalled] = useState(false);
    // const date = localStorage.getItem('dateToken');
    // const time = localStorage.getItem('timeToken');
    // const worker = localStorage.getItem('workerToken');

    // Use useRef to persist the flag across renders
    const effectCalled = useRef(false); //

    useEffect(() => {

        // if (effectCalled) return;
        // setEffectCalled(true);

        // if (called) return;
        // called = true;

        if (effectCalled.current) return; //
        effectCalled.current = true; // Mark as called

        // if (!sessionId || hasSent.current) return;

        // hasSent.current = true; // mark as run
        // In PaymentSuccess.jsx, replace the fetchSession function with this fixed version:

        const fetchSession = async () => {
            try {
                const res = await axios.get(`${baseUrl}/order/get/${sessionId}`);

                const order = res.data.order;

                // Set individual fields from metadata
                setQuoteRef(order.quotationRef);
                setBookingRef(order.bookingRef);
                const customerData = {
                    name: order.username || '',
                    email: order.email || '',
                    phone: order.phoneNumber || '',
                    isBusinessCustomer: order.details.isBusinessCustomer === 'true'
                };
                setCustomerDetails(customerData);

                setJourney({
                    distance: order.distance || '',
                    duration: order.duration || '',
                    route: order.route || 'default route'
                });

                setService(order.details.service);

                setQuoteDetails(
                    {...quoteDetails,
                    email:order.email
                });

                const pickupData = {
                    location: order.pickupLocation.location || pickup.location,
                    floor: order.pickupLocation.floor || pickup.floor,
                    liftAvailable: order.pickupLocation.lift === 'true',
                    propertyType: order.pickupLocation.propertyType || pickup.propertyType,
                    postcode: order.pickupAddress.postcode || pickup.postcode,
                    addressLine1: order.pickupAddress.addressLine1 || pickup.addressLine1,
                    addressLine2: order.pickupAddress.addressLine2 || pickup.addressLine2,
                    city: order.pickupAddress.city || pickup.city,
                    country: order.pickupAddress.country || pickup.country,
                    flatNo: order.details.pickupFlatNo || pickup.flatNo,
                    contactName: order.dropAddress.contactName || pickup.contactName,
                    contactPhone: order.dropAddress.contactPhone || pickup.contactPhone
                };
                setPickup(pickupData);

                const deliveryData = {
                    location: order.dropLocation.location || delivery.location,
                    floor: order.dropLocation.floor || delivery.floor,
                    liftAvailable: order.dropLocation.lift === 'true',
                    propertyType: order.dropLocation.propertyType || delivery.propertyType,
                    postcode: order.dropAddress.postcode || delivery.postcode,
                    addressLine1: order.dropAddress.addressLine1 || delivery.addressLine1,
                    addressLine2: order.dropAddress.addressLine2 || delivery.addressLine2,
                    city: order.dropAddress.city || delivery.city,
                    country: order.dropAddress.country || delivery.country,
                    flatNo: order.details.dropFlatNo || delivery.flatNo,
                    contactName: order.dropAddress.contactName || delivery.contactName,
                    contactPhone: order.dropAddress.contactPhone || delivery.contactPhone
                };
                setDelivery(deliveryData);
        
                setItemsList(order.details.items.name);
                setQuantities(order.details.items.quantity);

                setExtraStops(order.stoppage);

                // CREATE THE UPDATED DATE OBJECT FIRST
                const updatedSelectedDate = {
                    date: order.pickupDate || selectedDate.date,
                    pickupTime: order.pickupTime || selectedDate.pickupTime,
                    dropTime: order.dropTime || selectedDate.dropTime,
                    numberOfMovers: order.worker || selectedDate.numberOfMovers,
                    price: order.price
                };

                setSelectedDate(updatedSelectedDate);


                setAdditionalServices({
                    ...additionalServices,
                    specialRequirements: order.specialRequirements
                });

                // console.log("Before setting (metadata): ", m.van);
                // console.log("After setting (contextdata): ", van.type);

                setVan({
                    type: order.vanType
                });

                setPiano({
                    type: order.details.piano || piano.type
                });

                setItemsToAssemble(order.itemsToAssemble || itemsToAssemble);
                setItemsToDismantle(order.itemsToDismantle || itemsToDismantle);

                setTotalPrice(order.price || totalPrice);

                navigate('/confirmation');
            } catch (err) {
                console.error('Failed to fetch Stripe session or send booking:', err);
                // navigate('/payment-failed');
            }
        };

        if (sessionId) fetchSession();
        else navigate('/payment-failed');
    }, [sessionId]);



    // const sendBookingToServer = async (customerData, pickupData, deliveryData, parsedItems, parsedExtraStops, vanRef, quote, metadata) => {
    //     try {

    //         const validatedStops = validateExtraStops(parsedExtraStops);
    //         // Log the parsed items to verify they exist
    //         console.log("Parsed items in sendBookingToServer:", parsedItems);
    //         console.log("Parsed extra stops in sendBookingToServer:", parsedExtraStops);
    //         console.log("metadata: ", metadata);
    //         // Create the booking data object similar to what was in BookingDetails.jsx
    //         const bookingData = {
    //             username: customerData.name || 'NA',
    //             email: customerData.email || 'NA',
    //             phoneNumber: customerData.phone || 'NA',
    //             price: parseFloat(metadata.price) || 0,
    //             distance: parseInt(metadata.distance) || 0,
    //             route: journey.route || "default route",
    //             duration: metadata.duration || "N/A",
    //             pickupDate: metadata.pickupDate || 'NA',
    //             pickupTime: metadata.pickupTime || '08:00:00',
    //             pickupAddress: {
    //                 postcode: pickupData.postcode,
    //                 addressLine1: pickupData.addressLine1,
    //                 addressLine2: pickupData.addressLine2,
    //                 city: pickupData.city,
    //                 country: pickupData.country,
    //                 contactName: pickupData.contactName,
    //                 contactPhone: pickupData.contactPhone,
    //             },
    //             dropDate: metadata.dropDate || 'NA',
    //             dropTime: metadata.dropTime || '18:00:00',
    //             dropAddress: {
    //                 postcode: deliveryData.postcode,
    //                 addressLine1: deliveryData.addressLine1,
    //                 addressLine2: deliveryData.addressLine2,
    //                 city: deliveryData.city,
    //                 country: deliveryData.country,
    //                 contactName: deliveryData.contactName,
    //                 contactPhone: deliveryData.contactPhone,
    //             },
    //             vanType: vanRef || "N/A",
    //             worker: parseInt(metadata.worker) || 1,
    //             itemsToDismantle: parseInt(metadata.itemsToDismantle) || 0,
    //             itemsToAssemble: parseInt(metadata.itemsToAssemble) || 0,
    //             stoppage: validatedStops,
    //             pickupLocation: {
    //                 location: pickupData.location || "N/A",
    //                 floor: typeof pickupData.floor === 'string' ? parseInt(pickupData.floor) : pickupData.floor,
    //                 lift: pickupData.liftAvailable,
    //                 propertyType: pickupData.propertyType || "standard"
    //             },
    //             dropLocation: {
    //                 location: deliveryData.location || "N/A",
    //                 floor: typeof deliveryData.floor === 'string' ? parseInt(deliveryData.floor) : deliveryData.floor,
    //                 lift: deliveryData.liftAvailable,
    //                 propertyType: deliveryData.propertyType || "standard"
    //             },
    //             details: {
    //                 items: {
    //                     name: parsedItems?.map(item => item.name) || [],
    //                     quantity: parsedItems?.map(item => item.quantity) || [],
    //                 },
    //                 isBusinessCustomer: customerData.isBusinessCustomer,
    //                 motorBike: motorBike.type,
    //                 piano: piano.type,
    //                 specialRequirements: additionalServices.specialRequirements,
    //             },
    //             quotationRef: quote || 'NA'
    //         };

    //         console.log("Booking Data being sent:", JSON.stringify(bookingData, null, 2));
    //         console.log("date: ", metadata.pickupDate);

    //         // Send the booking data to the server
    //         // setTimeout(5000);
    //         const bookingResponse = await axios.post('https://api.reliancemove.com/new', bookingData);
    //         const bookingRefNumber = bookingResponse.data?.newOrder?.bookingRef;

    //         const vanTypeResponse = bookingResponse.data?.newOrder?.vanType;

    //         setVan({ ...van, type: vanTypeResponse });

    //         console.log("Full response: ", bookingResponse.data.newOrder);
    //         console.log("Booking response: ", bookingResponse);
    //         console.log("Booking ref: ", bookingRefNumber);
    //         console.log("Date: ", date);
    //         console.log("Time: ", time);
    //         console.log("worker: ", worker);


    //         return bookingRefNumber;
    //     } catch (error) {
    //         console.error('Error sending booking to server:', error);
    //         console.error('Error response data:', error.response.data);
    //         throw error;
    //     }
    // };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="mx-auto h-16 w-16 relative">
                        {/* Animated loading spinner */}
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Processing Your Payment
                </h2>

                <p className="text-gray-600 mb-6">
                    Please wait while we verify your payment and prepare your booking confirmation.
                </p>

                <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-gray-500">
                        This may take a few moments. Please don't close this page.
                    </p>
                </div>
            </div>

            <div className="mt-8 text-sm text-gray-500">
                © {new Date().getFullYear()} Reliance Move. All rights reserved.
            </div>
        </div>
    );
};

export default PaymentSuccess;