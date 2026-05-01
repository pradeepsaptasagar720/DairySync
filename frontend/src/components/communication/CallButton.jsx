import { Phone } from "lucide-react";
import PropTypes from "prop-types";

/**
 * CallButton Component
 * Displays a clickable phone button that initiates a call using tel: protocol
 * 
 * @param {string} phoneNumber - The phone number to call
 * @param {string} displayName - Name to display alongside the button
 * @param {string} userRole - Role of the current user ('buyer' or 'delivery_boy')
 * @param {string} orderStatus - Current status of the order
 */
export default function CallButton({ phoneNumber, displayName, userRole, orderStatus }) {
  // Determine if call button should be visible
  const isVisible = orderStatus === "Accepted" || orderStatus === "Out for Delivery";
  
  if (!isVisible || !phoneNumber) {
    return null;
  }
  
  // Format phone number for tel: link
  const telLink = `tel:${phoneNumber}`;
  
  return (
    <a
      href={telLink}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] touch-manipulation"
      aria-label={`Call ${displayName}`}
    >
      <Phone size={18} />
      <span className="font-medium">Call {displayName}</span>
    </a>
  );
}

CallButton.propTypes = {
  phoneNumber: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  userRole: PropTypes.oneOf(["buyer", "delivery_boy"]).isRequired,
  orderStatus: PropTypes.string.isRequired
};
