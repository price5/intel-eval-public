export const FluidBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated fluid orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-fluid-1" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/15 via-primary/10 to-transparent rounded-full blur-3xl animate-fluid-2" />
      <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-purple-500/10 via-primary/15 to-transparent rounded-full blur-3xl animate-fluid-3" />
    </div>
  );
};
