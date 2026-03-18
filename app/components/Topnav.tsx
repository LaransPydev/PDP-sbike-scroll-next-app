import { useState } from "react";
import { Search, User, ShoppingCart, ChevronDown, Menu, X } from "lucide-react";

const Topnav = () => {
  const [activeNav, setActiveNav] = useState("Bikes & Exercise Bikes");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    "Treadmills",
    "Bikes & Exercise Bikes",
    "Rowing machines",
    "Strength training",
    "Cross trainer",
    "Vibration plates",
    "Accessories",
    "App",
    "Spring Deals",
  ];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9998] bg-white/90 backdrop-blur-md shadow-sm font-sans"
      style={{ WebkitBackdropFilter: "blur(12px)" }}
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        
        {/* Left Section: Mobile Menu Toggle & Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            className="md:hidden text-gray-700 hover:text-red-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center">
            {/* Added max-h-6 to keep logo contained on mobile */}
            <img src="/logo_(5).svg" alt="Sportstech Logo" className="max-h-6 sm:max-h-8 w-auto" />
          </div>
        </div>

        {/* Desktop Nav Links (Hidden on Mobile) */}
        <nav
          className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 mx-6"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`nav::-webkit-scrollbar { display: none; }`}</style>

          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`whitespace-nowrap px-2.5 py-1 text-sm font-medium transition-colors rounded-md ${
                activeNav === item
                  ? "text-red-600 font-semibold"
                  : "text-gray-700 hover:text-red-600"
              }`}
            >
              {item}
            </button>
          ))}

          <button className="whitespace-nowrap px-2.5 py-1 text-sm font-medium text-gray-700 hover:text-red-600 flex items-center gap-0.5 flex-shrink-0">
            EU <ChevronDown size={12} />
          </button>
        </nav>

        {/* Right Section: Icons */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <button className="text-gray-700 hover:text-red-600 transition-colors">
            <Search size={19} />
          </button>
          <button className="text-gray-700 hover:text-red-600 transition-colors hidden sm:block">
            <User size={19} />
          </button>
          <button className="relative text-gray-700 hover:text-red-600 transition-colors">
            <ShoppingCart size={19} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              0
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white px-4 py-2 max-h-[60vh] overflow-y-auto shadow-inner">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                setActiveNav(item);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2.5 text-sm font-medium transition-colors ${
                activeNav === item ? "text-red-600 font-semibold" : "text-gray-700"
              }`}
            >
              {item}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button className="block w-full text-left py-2.5 text-sm font-medium text-gray-700 flex items-center justify-between">
              Region: EU <ChevronDown size={16} />
            </button>
            {/* User icon moved to mobile menu for smaller screens */}
            <button className="sm:hidden block w-full text-left py-2.5 text-sm font-medium text-gray-700 flex items-center gap-2">
              <User size={16} /> Account
            </button>
          </div>
        </div>
      )}

      {/* Product Sub-bar */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-2">
        {/* Product Title + Tabs */}
        <div className="flex items-center gap-6 min-w-0 flex-1">
          {/* Added truncate so long titles don't break mobile layout */}
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
            Sportstech sBike 21.5" display
          </h2>
          <div className="hidden lg:flex items-center gap-5">
            {["Overview", "Technical data", "Reviews"].map((tab) => (
              <button
                key={tab}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden md:block">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-red-600 font-bold text-[10px] sm:text-xs">26% savings</span>
              <span className="text-gray-400 line-through text-[10px] sm:text-xs">€1,767.80</span>
            </div>
            <div className="flex items-center gap-0.5 justify-end">
              <span className="text-lg sm:text-xl font-bold text-gray-900">€1,299.44</span>
              <span className="text-gray-400 text-xs">*</span>
            </div>
            <p className="text-gray-400 text-[10px] sm:text-xs">VAT included.</p>
          </div>
          
          {/* Mobile Only Price Summary (Optional, purely to save space) */}
          <div className="block md:hidden text-right">
             <span className="text-sm font-bold text-gray-900">€1,299.44</span>
          </div>

          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors text-xs sm:text-sm whitespace-nowrap">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topnav;