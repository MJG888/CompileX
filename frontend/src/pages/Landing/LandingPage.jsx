import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, Terminal, Zap, Save, Moon, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';

const LandingPage = () => {
  const [typedCode, setTypedCode] = useState('');
  const fullCode = `function greet() {\n  console.log("Hello CompileX!");\n}\n\ngreet();`;
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullCode.length) {
        setTypedCode(prev => prev + fullCode.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#171e19] text-white font-sans overflow-x-hidden selection:bg-yellow selection:text-black">
      {/* 1. Fixed Navbar handled by App/Navbar component, but we will assume it's included here or globally */}
      <Navbar isLanding={true} />

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE */}
          <div className="space-y-8">
            <div className="inline-block bg-yellow text-black font-bold px-4 py-2 brutal-border brutal-shadow text-sm uppercase tracking-wider">
              NEW: AI Assisted Coding
            </div>
            <h1 className="font-heading text-6xl md:text-8xl leading-none uppercase flex flex-col">
              <span className="text-white">Compile &</span>
              <span className="text-transparent" style={{ WebkitTextStroke: '2px #ffe17c' }}>Run</span>
              <span className="text-white">Code Instantly</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/compiler" className="bg-yellow text-black font-bold px-8 py-4 text-center text-lg brutal-border brutal-shadow brutal-hover">
                Start Coding
              </Link>
              <a href="#features" className="bg-white text-black font-bold px-8 py-4 text-center text-lg brutal-border brutal-shadow brutal-hover">
                View Features
              </a>
            </div>
          </div>

          {/* RIGHT SIDE: Browser Mockup */}
          <div className="relative">
            <div className="bg-[#272727] brutal-border brutal-shadow rounded-none overflow-hidden">
              {/* Browser Top Bar */}
              <div className="bg-white border-b-2 border-black p-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 brutal-border" />
                <div className="w-3 h-3 rounded-full bg-yellow brutal-border" />
                <div className="w-3 h-3 rounded-full bg-green-500 brutal-border" />
                <div className="mx-auto bg-gray-100 text-black px-4 py-1 text-xs brutal-border font-bold">compilex.app/compiler</div>
              </div>
              {/* Editor Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 h-[400px]">
                {/* Editor Tab */}
                <div className="border-r-2 border-black flex flex-col">
                  <div className="bg-charcoal text-white text-sm border-b-2 border-black p-2 font-bold flex justify-between">
                    <span>main.js</span>
                    <span className="text-yellow">JavaScript</span>
                  </div>
                  <div className="p-4 font-mono text-sm text-sage flex-1 bg-[#171e19]">
                    <span className="text-yellow">function</span> <span className="text-white">greet</span>() {'{\n'}
                    {'  '}console.log(<span className="text-sage">"Hello World"</span>);{'\n'}
                    {'}'}{'\n\n'}
                    <span className="text-white">greet</span>();
                    <span className="animate-pulse bg-white w-2 h-4 inline-block ml-1 align-middle" />
                  </div>
                </div>
                {/* Output Terminal */}
                <div className="bg-[#272727] flex flex-col">
                  <div className="bg-charcoal text-white text-sm border-b-2 border-black p-2 font-bold flex justify-between items-center">
                    <span>Terminal</span>
                    <button className="bg-yellow text-black px-2 py-0.5 brutal-border text-xs">RUN</button>
                  </div>
                  <div className="p-4 font-mono text-sm text-white">
                    <div className="text-gray-400">$ node main.js</div>
                    <div className="mt-2 text-green-400">Hello World</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Supported Languages Marquee */}
      <section className="border-y-2 border-black bg-[#171e19] overflow-hidden py-4">
        <div className="whitespace-nowrap flex animate-[marquee_20s_linear_infinite]">
          {/* Duplicate to create infinite effect */}
          {[...Array(4)].map((_, i) => (
            <span key={i} className="text-5xl font-heading font-extrabold text-[#b7c6c2]/50 px-8 mx-4">
              PYTHON • C • C++ • JAVA • JAVASCRIPT •
            </span>
          ))}
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="bg-yellow py-24 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-5xl text-black uppercase mb-12 text-center">Powerful Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Fast Compilation", icon: Zap, desc: "Lightning fast execution using isolated Docker containers." },
              { title: "Real-time Output", icon: Terminal, desc: "Interactive terminal for stdin and stdout." },
              { title: "Syntax Highlighting", icon: Code, desc: "Powered by Monaco editor with advanced intellisense." },
              { title: "Multi-language", icon: CheckCircle2, desc: "Support for all major programming languages." },
              { title: "Save History", icon: Save, desc: "Automatically save your code executions to the cloud." },
              { title: "Dark Mode", icon: Moon, desc: "Easy on the eyes with our neo-brutalist dark theme." },
            ].map((feat, idx) => (
              <div key={idx} className="bg-white text-black p-6 brutal-border brutal-shadow brutal-hover cursor-pointer group">
                <feat.icon className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-2">{feat.title}</h3>
                <p className="text-gray-700">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Live Playground Preview */}
      <section className="py-24 bg-[#171e19] border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-heading text-5xl text-center text-white mb-12 uppercase">Live Playground</h2>
          <div className="bg-[#272727] brutal-border brutal-shadow-lg flex flex-col">
            <div className="border-b-2 border-black p-2 bg-yellow font-bold text-black flex justify-between">
              <span>Editor Window</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-white brutal-border" />
                <div className="w-3 h-3 bg-white brutal-border" />
              </div>
            </div>
            <div className="p-6 font-mono text-lg text-sage min-h-[200px]">
              <pre className="whitespace-pre-wrap">
                {typedCode}
                <span className="animate-pulse bg-yellow w-3 h-5 inline-block ml-1 align-middle" />
              </pre>
            </div>
            <div className="border-t-2 border-black bg-charcoal p-4 font-mono text-green-400 min-h-[100px]">
              {typedCode.length === fullCode.length ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  $ executing...<br/>
                  Hello CompileX!
                </motion.div>
              ) : (
                <span className="text-gray-500">Waiting for input...</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. How CompileX Works */}
      <section className="py-24 bg-[#272727] border-b-2 border-black text-white">
        <div className="max-w-6xl mx-auto px-4 relative">
          <h2 className="font-heading text-5xl text-center uppercase mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-yellow text-black font-heading text-4xl flex items-center justify-center rounded-full brutal-border brutal-shadow mb-6 z-10 relative">1</div>
              <div className="bg-[#171e19] p-6 brutal-border brutal-shadow w-full">
                <h3 className="font-bold text-2xl mb-2 text-yellow">Write Code</h3>
                <p className="text-sage">Jump into the editor and start writing in your favorite language.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center mt-12 md:mt-0">
              <div className="w-20 h-20 bg-white text-black font-heading text-4xl flex items-center justify-center rounded-full brutal-border brutal-shadow mb-6 z-10 relative">2</div>
              <div className="bg-[#171e19] p-6 brutal-border brutal-shadow w-full">
                <h3 className="font-bold text-2xl mb-2">Compile Instantly</h3>
                <p className="text-sage">Hit run and watch your code compile in milliseconds.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center mt-12 md:mt-0">
              <div className="w-20 h-20 bg-yellow text-black font-heading text-4xl flex items-center justify-center rounded-full brutal-border brutal-shadow mb-6 z-10 relative">3</div>
              <div className="bg-[#171e19] p-6 brutal-border brutal-shadow w-full">
                <h3 className="font-bold text-2xl mb-2 text-yellow">Run & Share</h3>
                <p className="text-sage">View output, test with inputs, and share with your team.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Stats */}
      <section className="py-20 bg-[#171e19] border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center font-heading">
          <div>
            <div className="text-6xl text-yellow brutal-text-shadow">1M+</div>
            <div className="text-xl mt-2 text-sage uppercase tracking-widest">Programs Executed</div>
          </div>
          <div>
            <div className="text-6xl text-white brutal-text-shadow">99.9%</div>
            <div className="text-xl mt-2 text-sage uppercase tracking-widest">Uptime</div>
          </div>
          <div>
            <div className="text-6xl text-yellow brutal-text-shadow">5</div>
            <div className="text-xl mt-2 text-sage uppercase tracking-widest">Languages</div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="py-32 bg-yellow text-black border-b-2 border-black text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-heading text-6xl md:text-8xl uppercase leading-none mb-10">
            Your Browser Is Now Your IDE.
          </h2>
          <Link to="/compiler" className="inline-block bg-black text-white font-bold text-2xl px-12 py-6 brutal-border brutal-shadow brutal-hover hover:text-yellow">
            Start Coding Free
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-charcoal text-sage py-8 text-center border-t border-black font-mono">
        <p>© 2026 CompileX. All rights reserved.</p>
      </footer>

      {/* Keyframes for Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-\\[marquee_20s_linear_infinite\\] {
          animation: marquee 20s linear infinite;
        }
        .brutal-text-shadow {
          text-shadow: 4px 4px 0px #000;
        }
      `}} />
    </div>
  );
};

export default LandingPage;
