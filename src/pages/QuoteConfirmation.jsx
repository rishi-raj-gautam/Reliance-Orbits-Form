import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Header from '../components/Header';
import RouteMap from '../components/RouteMap';

const QuoteConfirmation = () => {
  const navigate = useNavigate();
  const {
    quoteRef,
    bookingRef,
    quoteDetails,
    pickup,
    delivery,
    extraStops,
    items,
    selectedDate,
    additionalServices,
    customerDetails,
    journey,
    totalPrice,
    van,
    itemsToAssemble,
    itemsToDismantle,
    itemsList,
    quantities,
    service
  } = useBooking();


  const formatAddress = (address) => {
    const parts = [];
    if (address.flatNo) parts.push(`Flat/Unit ${address.flatNo}`);
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.addressLine2) parts.push(address.addressLine2);
    if (address.city) parts.push(address.city);
    if (address.postcode) parts.push(address.postcode);
    if (address.country) parts.push(address.country);
    return parts.filter(Boolean).join(', ');
  };

  const renderAddressCard = (location, address, color, letter) => (
    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-solid" style={{ borderLeftColor: color }}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className={`text-white rounded-full w-8 h-8 flex items-center justify-center font-medium shadow-md`} style={{ backgroundColor: color }}>
            {letter}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="font-medium text-gray-800">{location}</div>
          <div className="text-sm text-gray-600 mt-1">{formatAddress(address)}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
              {address.propertyType || "Unknown property type"}
            </span>
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
              Floor: {address.floor || "Ground"}
            </span>
            {address.liftAvailable && (
              <span className="inline-flex items-center bg-green-100 px-2 py-1 rounded text-xs font-medium text-green-700">
                Lift Available
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header title="Booking Confirmed!" /> */}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center mb-8 shadow">
          <div className="bg-green-500 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 text-3xl font-bold shadow-lg">✓</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Thank you for your booking!</h2>
          <p className="text-gray-700">Hi <span className="font-medium">{customerDetails?.name || "you"}</span> </p>
          <p className="text-gray-700">We have sent a confirmation email to <span className="font-medium">{quoteDetails?.email || "your email"}</span></p>
          <p className="text-gray-700 font-bold mt-2">Here's a Summary of your Booking for {service}</p>
          <div className='bg-blue-500 h-1 w-16 mx-auto mt-3'></div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <div className="border-b border-gray-200 p-6 bg-blue-50">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Your Booking Reference</h3>
            <div className="text-3xl font-bold text-blue-600 tracking-wide">{bookingRef || "Processing..."}</div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Journey Details
            </h3>

            <div className="space-y-4 mb-6">
              {/* Pickup Location */}
              {pickup && renderAddressCard(pickup.location || "Pickup Location", pickup, "#3b82f6", "A")}

              {/* Extra Stops */}
              {extraStops && extraStops.length > 0 && (
                <div className="pl-4 space-y-4">
                  {extraStops.map((stop, index) => (
                    <div key={index} className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300 -ml-2"></div>
                      {renderAddressCard(
                        stop.address || `Stop ${index + 1}`,
                        {
                          addressLine1: stop.addressLine1,
                          addressLine2: stop.addressLine2,
                          city: stop.city,
                          postcode: stop.postcode,
                          country: stop.country,
                          propertyType: stop.propertyType,
                          floor: stop.floor,
                          liftAvailable: stop.liftAvailable,
                          flatNo: stop.flatNo || stop.doorFlatNo
                        },
                        "#eab308",
                        `${String.fromCharCode(66 + index)}`
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Location */}
              {delivery && (
                <div className="relative">
                  {extraStops && extraStops.length > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300 -ml-2"></div>
                  )}
                  {renderAddressCard(
                    delivery.location || "Delivery Location",
                    delivery,
                    "#16a34a",
                    extraStops && extraStops.length > 0 ? `${String.fromCharCode(66 + extraStops.length)}` : "B"
                  )}
                </div>
              )}
            </div>

            <div className="my-6 px-4 py-3 bg-blue-50 rounded-lg">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm font-medium">Distance: <span className="text-gray-700">{journey?.distance || "Calculating..."}</span></div>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm font-medium">Duration: <span className="text-gray-700">{journey?.duration || "Calculating..."}</span></div>
                </div>
              </div>
            </div>

            <div className="h-64 bg-gray-100 rounded-lg mb-6 overflow-hidden shadow-inner">
              <RouteMap />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200 bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3 text-blue-600 text-xl">📅</div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">Moving Date</div>
                  <div className="font-medium text-gray-800">{selectedDate?.date || "To be confirmed"}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-full p-3 text-indigo-600 text-xl">⏰</div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">Time Window</div>
                  <div className="font-medium text-gray-800">
                    {selectedDate?.pickupTime ? `${selectedDate.pickupTime} - ${selectedDate.dropTime || 'TBC'}` : 'To be confirmed'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3 text-purple-600 text-xl">👥</div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">Service Level</div>
                  <div className="font-medium text-gray-800">{selectedDate?.numberOfMovers} Person Removal</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Vehicle & Items
            </h3>

            {/* Vehicle Section */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <h4 className="font-medium text-gray-700 mb-2">Vehicle Type</h4>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="font-medium text-gray-800">
                  {typeof van === 'string' ? van : van && van.type ? van.type + ' Van' : 'Standard Van'}
                </span>
              </div>
            </div>

            {/* Items Section */}
            <h4 className="font-medium text-gray-700 mb-3">Items Summary</h4>
            {itemsList && itemsList.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {itemsList.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50">
                      <div className="font-medium text-gray-700">{item || `Item ${index + 1}`}</div>
                      <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-700 text-sm font-medium">
                        ×{quantities[index] || 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-700">
                No items have been specified for this move.
              </div>
            )}
          </div>

          <div className="p-6 border-b border-gray-200">
  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    Customer Details
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm font-medium text-gray-500">Name</div>
      <div className="font-medium text-gray-800">{customerDetails?.name || "Not provided"}</div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm font-medium text-gray-500">Phone</div>
      <div className="font-medium text-gray-800">{customerDetails?.phone || "Not provided"}</div>
    </div>
  </div>
</div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Additional Services
            </h3>

            <div className="space-y-3">
              {additionalServices && additionalServices.basicCompensation && (
                <div className="flex items-center bg-green-50 p-3 rounded-lg">
                  <div className="bg-green-100 rounded-full p-2 text-green-600">✓</div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-800">Basic Compensation Cover</div>
                    <div className="text-sm text-gray-600">Standard protection included</div>
                  </div>
                </div>
              )}

              {additionalServices && additionalServices.comprehensiveInsurance && (
                <div className="flex items-center bg-blue-50 p-3 rounded-lg">
                  <div className="bg-blue-100 rounded-full p-2 text-blue-600">✓</div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-800">Comprehensive Insurance</div>
                    <div className="text-sm text-gray-600">Enhanced protection for your valuables</div>
                  </div>
                </div>
              )}

              {itemsToDismantle > 0 && (
                <div>
                  🔧
                  <div>
                    <div>Dismantling Service</div>
                    <div>
                      {itemsToDismantle} {itemsToDismantle === 1 ? 'item' : 'items'} to dismantle
                    </div>
                  </div>
                </div>
              )}

              {itemsToAssemble > 0 && (
                <div>
                  🔨
                  <div>
                    <div>Reassembly Service</div>
                    <div>
                      {itemsToAssemble} {itemsToAssemble === 1 ? 'item' : 'items'} to assemble
                    </div>
                  </div>
                </div>
              )}

              {(!additionalServices || (
                !additionalServices.basicCompensation &&
                !additionalServices.comprehensiveInsurance &&
                (!additionalServices.dismantling || additionalServices.dismantling.length === 0) &&
                (!additionalServices.reassembly || additionalServices.reassembly.length === 0) &&
                !additionalServices.specialRequirements
              )) && (
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-600 italic">
                    No additional services selected
                  </div>
                )}
            </div>
          </div>

          {additionalServices && additionalServices.specialRequirements && (
            <div className="p-6 border-b border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Special Requirements
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 text-sm">
                {additionalServices.specialRequirements}
              </div>
            </div>
          )}

          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex justify-between items-center mb-3">
              <div className="font-semibold text-lg text-gray-700">Total Price</div>
              <div className="font-bold text-2xl text-blue-600">£{totalPrice ? totalPrice.toFixed(2) : '0.00'}</div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                Paid in full
              </span>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-700 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What happens next?
            </h4>
            <div className="space-y-4">
              <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">1</div>
                <div className="ml-4">
                  <div className="font-medium text-gray-800">Check your email</div>
                  <div className="text-sm text-gray-600">We've sent a booking confirmation to {customerDetails?.email || "your email"}</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">2</div>
                <div className="ml-4">
                  <div className="font-medium text-gray-800">Receive a confirmation call</div>
                  <div className="text-sm text-gray-600">Our team will call you to confirm all the details</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">3</div>
                <div className="ml-4">
                  <div className="font-medium text-gray-800">Moving day!</div>
                  <div className="text-sm text-gray-600">Your movers will arrive on <span className="font-medium">{selectedDate?.date || "the scheduled date"}</span> at the scheduled time</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h4 className="font-medium text-gray-700 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Need help?
            </h4>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-3 text-red-600 text-xl">📞</div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Customer Support</div>
                  <div className="font-medium text-gray-800">020 3051 6033</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3 text-blue-600 text-xl">✉️</div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Email Support</div>
                  <div className="font-medium text-gray-800">info@reliancemove.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-white border border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-lg shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Confirmation
          </button>
          <button
            type="button"
            className="bg-blue-600 text-white font-medium py-4 px-6 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition flex items-center justify-center"
            onClick={() => window.location.href = 'https://reliancemove.com'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Book Another Move
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteConfirmation;