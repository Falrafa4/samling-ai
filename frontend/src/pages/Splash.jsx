export default function Splash() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col justify-center items-center overflow-hidden transition-colors duration-200">
      <div className="text-center">
        <img
          src="/img/samling-v1-transparent.webp"
          alt="Samling AI"
          className="h-20 w-auto animate-fade-in"
        />
        <p className="text center mt-2 text-lg md:text-xl text-gray-500 dark:text-gray-400 font-sans tracking-wide animate-[fadeIn_0.6s_ease-out_0.3s_forwards] opacity-0">
          One Smart Solution for Jakarta
        </p>
      </div>
    </div>
  );
}
