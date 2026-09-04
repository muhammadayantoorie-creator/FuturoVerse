/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Image as ImageIcon, Sparkles, Brain, CheckCircle2, AlertCircle, ArrowRight, Zap, RefreshCw, FileText } from 'lucide-react';
import { MathRenderer } from '@/src/components/shared/MathRenderer';
import { useAppStore } from '@/src/store/useAppStore';

interface SolutionResult {
  problemSummary: string;
  extractedFormulas: string[];
  stepByStepSolution: Array<{ step: number; title: string; mathExpression: string; explanation: string }>;
  finalAnswer: string;
  coreConcepts: string[];
  commonMistakes: string[];
  practiceProblem: { question: string; hint: string };
}

const SAMPLE_DEMOS = [
  {
    id: 'projectile',
    title: 'Kinematics: 2D Projectile Range & Max Height',
    subject: 'Physics 101',
    imagePreview: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
    sampleText: 'A ball is launched from ground level with initial velocity v0 = 25 m/s at an angle θ = 35° above the horizontal. Find (a) Maximum height H, (b) Time of flight T, and (c) Total horizontal range R (take g = 9.8 m/s²).'
  },
  {
    id: 'calculus',
    title: 'Calculus: Integration by Parts & Definite Integral',
    subject: 'Mathematics 301',
    imagePreview: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop',
    sampleText: 'Evaluate the definite integral: \\int_{0}^{1} x \\cdot e^{2x} dx using the integration by parts formula \\int u dv = uv - \\int v du.'
  },
  {
    id: 'circuits',
    title: 'Circuit Analysis: Kirchhoffs Voltage Law (KVL)',
    subject: 'Electrical Eng',
    imagePreview: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=600&auto=format&fit=crop',
    sampleText: 'For a series RLC circuit with V(t) = 120\\cos(377t), R = 40\\Omega, L = 0.1H, and C = 50\\mu F, compute the total impedance Z and the phase angle \\phi.'
  }
];

export const MultimodalSolver: React.FC = () => {
  const { locale } = useAppStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<SolutionResult | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'steps' | 'concepts' | 'practice'>('steps');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectDemo = (demo: typeof SAMPLE_DEMOS[0]) => {
    setSelectedImage(demo.imagePreview);
    setProblemDescription(demo.sampleText);
    setSolution(null);
  };

  const handleSolve = async () => {
    if (!selectedImage && !problemDescription.trim()) return;

    setIsSolving(true);
    try {
      const res = await fetch('/api/ai/solve-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: selectedImage,
          problemText: problemDescription,
          language: locale === 'ur' ? 'Urdu' : 'English',
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSolution(result);
      } else {
        throw new Error('The AI vision service could not process this request.');
      }
    } catch (err) {
      console.error('Vision Solver error:', err);
      setSolution(null);
    } finally {
      setIsSolving(false);
    }
  };

  const simulateDetailedSolution = () => {
    setSolution({
      problemSummary: 'Analysis of classical 2D kinematics trajectory with constant gravitational acceleration vector $\\vec{g} = -9.8\\hat{j} \\text{ m/s}^2$.',
      extractedFormulas: [
        'v_{0x} = v_0 \\cos\\theta',
        'v_{0y} = v_0 \\sin\\theta',
        'H_{max} = \\frac{v_{0y}^2}{2g}',
        'R = \\frac{v_0^2 \\sin(2\\theta)}{g}'
      ],
      stepByStepSolution: [
        {
          step: 1,
          title: 'Resolve Initial Velocity Components',
          mathExpression: 'v_{0x} = 25 \\cos(35^\\circ) \\approx 20.48 \\text{ m/s}, \\quad v_{0y} = 25 \\sin(35^\\circ) \\approx 14.34 \\text{ m/s}',
          explanation: 'Split the launching vector into orthogonal Cartesian coordinates to isolate horizontal uniform motion from vertical accelerated motion.'
        },
        {
          step: 2,
          title: 'Calculate Peak Altitude (Maximum Height)',
          mathExpression: 'H = \\frac{(14.34)^2}{2 \\times 9.8} = \\frac{205.62}{19.6} \\approx 10.49 \\text{ meters}',
          explanation: 'At apex, vertical velocity $v_y(t_{apex}) = 0$. Using Torricellis kinematic formula gives the maximum displacement along the y-axis.'
        },
        {
          step: 3,
          title: 'Determine Total Time of Flight and Horizontal Range',
          mathExpression: 'T = \\frac{2 \\times 14.34}{9.8} \\approx 2.93 \\text{ s}, \\quad R = v_{0x} \\cdot T = 20.48 \\times 2.93 \\approx 59.94 \\text{ meters}',
          explanation: 'Since launch and landing altitudes match, the flight time is twice the ascent time, giving the horizontal displacement vector.'
        }
      ],
      finalAnswer: 'Maximum Height $H = 10.49\\text{ m}$, Flight Duration $T = 2.93\\text{ s}$, Horizontal Range $R = 59.94\\text{ m}$.',
      coreConcepts: [
        'Independence of horizontal and vertical kinematic degrees of freedom',
        'Parabolic trajectory curvature under uniform downward gravitational field',
        'Optimal launch angle theorem (45° for flat terrain without drag)'
      ],
      commonMistakes: [
        'Confusing sine and cosine when resolving velocity components with non-horizontal reference lines',
        'Forgetting to multiply ascent time by 2 when computing symmetric total flight time',
        'Omitting air resistance assumptions in empirical lab setups'
      ],
      practiceProblem: {
        question: 'If the launch velocity is doubled to $v_0 = 50\\text{ m/s}$ at the same angle $35^\\circ$, by what factor does the total range $R$ increase?',
        hint: 'Notice that range $R \\propto v_0^2$. Doubling velocity scales range by $2^2 = 4\\times$.'
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Brain className="w-48 h-48 text-emerald-400" />
        </div>
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Multimodal Vision Engine
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            AI Vision Problem Solver & LaTeX Step-by-Step Derivation
          </h2>
          <p className="text-slate-300 text-sm">
            Snap or upload photos of handwritten calculus, physics diagrams, or circuit schematics. Gemini 2.5 extracts the equations, validates calculations, and provides interactive pedagogical derivations.
          </p>
        </div>

        {/* Optional samples are disabled in production so results always come from user input. */}
        {false && <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> 1-Click Demo Samples for Presentation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_DEMOS.map((demo) => (
              <button
                key={demo.id}
                onClick={() => handleSelectDemo(demo)}
                className="flex items-center gap-3 p-2.5 bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-slate-700/70 rounded-2xl text-left transition-all group"
              >
                <img
                  src={demo.imagePreview}
                  alt={demo.title}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-600 group-hover:scale-105 transition-transform"
                />
                <div className="overflow-hidden">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    {demo.subject}
                  </span>
                  <p className="text-xs text-slate-200 font-semibold truncate">{demo.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>}
      </div>

      {/* Input Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Upload / Input Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-lg">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" /> Upload Problem Image or Diagram
            </h3>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {selectedImage ? (
                <div className="relative w-full">
                  <img
                    src={selectedImage}
                    alt="Upload Preview"
                    className="w-full h-48 object-cover rounded-xl border border-slate-700"
                  />
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/90 text-slate-300 text-[10px] font-bold rounded-lg backdrop-blur-sm">
                    Click to Change Image
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">Drag & drop or browse</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </label>

            {/* Problem Text Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Problem Statement or Notes (Optional)</span>
                {problemDescription && (
                  <button
                    onClick={() => setProblemDescription('')}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Type additional parameters or equations if not fully visible in image..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 resize-none font-sans"
              />
            </div>

            {/* Submit Action */}
            <button
              onClick={handleSolve}
              disabled={isSolving || (!selectedImage && !problemDescription.trim())}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSolving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Multimodal Geometry & Deriving Steps...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Derive Step-by-Step AI Solution
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-7">
          {!solution && !isSolving && (
            <div className="h-full min-h-[380px] p-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-500 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-white font-bold text-base mb-1">Awaiting Mathematical Input</h4>
              <p className="text-slate-400 text-xs max-w-sm">
                Upload a photo of your problem or select one of the 1-click presentation presets above to see the AI multimodal derivation.
              </p>
            </div>
          )}

          {isSolving && (
            <div className="h-full min-h-[380px] p-8 bg-slate-900 border border-emerald-500/30 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 animate-pulse">
                <Brain className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-white font-bold text-base mb-1">Inspecting Image with Gemini 2.5 Flash</h4>
              <p className="text-slate-400 text-xs max-w-sm">
                Extracting numerical parameters, verifying vector calculus, and rendering LaTeX proof...
              </p>
            </div>
          )}

          {solution && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl space-y-0"
            >
              {/* Solution Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Derived Solution Proof
                  </span>
                  <h3 className="text-white font-bold text-base mt-0.5">Step-by-Step Mathematical Derivation</h3>
                </div>

                {/* Sub-tab Switcher */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  {(['steps', 'concepts', 'practice'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveStepTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                        activeStepTab === tab
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Final Answer Banner */}
              <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-300 uppercase tracking-wider block text-[10px]">
                    Verified Answer:
                  </span>
                  <MathRenderer content={solution.finalAnswer} className="text-emerald-100 font-semibold" />
                </div>
              </div>

              {/* Main Content Body */}
              <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
                {activeStepTab === 'steps' && (
                  <div className="space-y-4">
                    {/* Key Formulas Extracted */}
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Governing Equations & Formulas:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {solution.extractedFormulas.map((formula, idx) => (
                          <div key={idx} className="px-2.5 py-1 bg-slate-900 border border-emerald-500/30 rounded-lg text-xs">
                            <MathRenderer content={`$${formula}$`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step Cards */}
                    {solution.stepByStepSolution.map((st) => (
                      <div
                        key={st.step}
                        className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                            {st.step}
                          </span>
                          <h4 className="text-white font-bold text-xs">{st.title}</h4>
                        </div>
                        <MathRenderer content={`$$${st.mathExpression}$$`} />
                        <p className="text-xs text-slate-300 leading-relaxed">{st.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeStepTab === 'concepts' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-emerald-400" /> Core Theoretical Principles
                      </h4>
                      <ul className="space-y-2">
                        {solution.coreConcepts.map((concept, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            {concept}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Common Student Pitfalls & Traps
                      </h4>
                      <ul className="space-y-2">
                        {solution.commonMistakes.map((mistake, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-rose-950/10 p-2.5 rounded-xl border border-rose-500/20">
                            <span className="text-rose-400 font-bold">⚠️</span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeStepTab === 'practice' && (
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-white font-bold text-xs">AI-Generated Reinforcement Challenge</h4>
                    </div>
                    <MathRenderer content={solution.practiceProblem.question} className="text-slate-200 text-xs leading-relaxed" />
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                      <span className="font-bold text-amber-400 block text-[10px] uppercase tracking-wider mb-1">
                        Pedagogical Hint:
                      </span>
                      {solution.practiceProblem.hint}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
