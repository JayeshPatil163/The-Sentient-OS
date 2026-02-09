import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, BarChart3, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#1A1A1A] font-sans">
      <section className="container mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto bg-white rounded-[40px] p-12 shadow-sm border border-black/5"
        >
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <img src="../public/Sentient_OS.png" alt="" className="text-white w-6 h-6" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
            Building digital <span className="text-gray-400">efficiency</span>, logic, and scheduling.
          </h1>
          
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Experience the next generation of CPU scheduling with AI-powered ADRR and real-time Gantt visualizations.
          </p>

          <button 
            onClick={() => navigate('/simulator')}
            className="bg-black text-white px-8 py-4 rounded-full font-medium flex items-center gap-2 mx-auto hover:bg-gray-800 transition-all"
          >
            Launch Simulator <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      <section className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap />, title: "ADRR Algorithm", desc: "Adaptive dynamic time quantum for maximum efficiency." },
            { icon: <BarChart3 />, title: "Gantt Visuals", desc: "Crystal clear timelines of process execution." },
            { icon: <Cpu />, title: "Comparison Mode", desc: "Test SJF, Round Robin, and ADRR side-by-side." }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-black/5 hover:shadow-md transition-shadow">
              <div className="mb-4 text-gray-400">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;