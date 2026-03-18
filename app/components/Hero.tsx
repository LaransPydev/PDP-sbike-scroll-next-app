const Hero = () => {
  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-900">
      
      {/* Desktop Video (Hidden on mobile, visible on medium screens and up) */}
      <video 
        src="/28_08_2024_sbike_short_desktop (1).mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        className="hidden md:block w-full h-full object-cover"
      />

      {/* Mobile Video (Visible on mobile, hidden on medium screens and up) */}
      <video 
        // Note: If you don't have a mobile specific video yet, you can just paste the desktop URL here too. 
        // 'object-cover' will handle the cropping automatically.
        src="/28_08_2024_sbike_short_desktop (1).mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        className="block md:hidden w-full h-full object-cover"
      />
      
      {/* Optional: Dark overlay if you plan to add text/buttons on top */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      
    </div>
  )
}

export default Hero;