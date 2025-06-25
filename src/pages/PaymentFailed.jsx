import { useState } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import { useNavigate} from 'react-router-dom';


export default function PaymentFailed() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const today = new Date(); // or use new Date('2025-06-25') for a fixed date

const day = today.getDate();
const month = today.toLocaleString('default', { month: 'long' });
const year = today.getFullYear();

// Function to get ordinal suffix
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const formattedDate = `${getOrdinal(day)} ${month}, ${year}`;



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-red-50 p-6 flex flex-col items-center">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Failed</h1>
          <p className="text-gray-600 text-center">
            We couldn't process your payment. Please check your payment details and try again.
          </p>
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Error details</h2>
            <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-600">
              <p className="mb-1"><span className="font-semibold">Error code:</span> PAYMENT_DECLINED</p>
              <p className="mb-1"><span className="font-semibold">Date:</span> {formattedDate}</p>
              <p><span className="font-semibold">Message:</span> The card issuer declined the transaction.</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Possible reasons</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
              <li>Insufficient funds in your account</li>
              <li>Incorrect payment information</li>
              <li>Your card has been blocked by your bank</li>
              <li>Temporary issue with your payment provider</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                'Try Again'
              )}
            </button>
            
            <div className="flex space-x-3">
              <button className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => navigate('/booking-details')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <button className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <HelpCircle className="mr-2 h-4 w-4" />
                Get Help
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-6 text-sm text-gray-500">
        Need assistance? Contact support at <span className="text-blue-600">info@reliancemove.com</span>
      </p>
    </div>
  );
}