import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["amazing", "new", "wonderful", "beautiful", "smart"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev + 1) % titles.length);
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full max-w-6xl mx-auto text-center space-y-8 z-10 relative px-4">
      <div>
        <Button variant="secondary" size="sm" className="gap-4">
          Read our launch article <MoveRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex gap-4 flex-col">
        <h1 className="text-5xl md:text-7xl max-w-2xl mx-auto tracking-tighter text-center font-regular">
          <span className="text-white">This is something</span>
          <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
            &nbsp;
            {titles.map((title, index) => (
              <motion.span
                key={index}
                className="absolute font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: "-100" }}
                transition={{ type: "spring", stiffness: 50 }}
                animate={
                  titleNumber === index
                    ? { y: 0, opacity: 1 }
                    : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                }
              >
                {title}
              </motion.span>
            ))}
          </span>
        </h1>

        <p className="text-lg md:text-xl leading-relaxed tracking-tight text-white/60 max-w-2xl mx-auto text-center">
          Managing a small business today is already tough. Avoid further
          complications by ditching outdated, tedious trade methods. Our
          goal is to streamline SMB trade, making it easier and faster than
          ever.
        </p>
      </div>
      <div className="flex flex-row gap-3 justify-center">
        <Button size="lg" className="gap-4" variant="outline">
          Jump on a call <PhoneCall className="w-4 h-4" />
        </Button>
        <Button size="lg" className="gap-4">
          Sign up here <MoveRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export { Hero };
