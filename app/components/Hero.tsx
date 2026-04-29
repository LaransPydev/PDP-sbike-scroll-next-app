const Hero = () => {
  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-900">
      
      {/* Responsive Video (Visible on all screens) */}
      <video 
        src="https://www.sportstech.de/media/36/57/da/1750176850/28_08_2024_sbike_short_desktop.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        className="block w-full h-full object-cover"
      />
      
      {/* Optional: Dark overlay if you plan to add text/buttons on top */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      
    </div>
  )
}

export default Hero;