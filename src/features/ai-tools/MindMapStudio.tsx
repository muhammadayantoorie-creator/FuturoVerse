/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Sparkles, ZoomIn, ZoomOut, Maximize2, Download, CheckCircle2, ChevronRight, BookOpen, Layers, Lightbulb, Check, X } from 'lucide-react';
import { MathRenderer } from '@/src/components/shared/MathRenderer';

interface MindNode {
  id: string;
  title: string;
  category: string;
  description: string;
  details: string;
  formula?: string;
  quizQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  children?: MindNode[];
}

const PRESET_MINDMAPS: Record<string, MindNode> = {
  quantum: {
    id: 'root-qm',
    title: 'Quantum Mechanics Core',
    category: 'Core Discipline',
    description: 'Foundations of probabilistic wave mechanics and quantum state dynamics.',
    details: 'Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles.',
    formula: 'i\\hbar \\frac{\\partial}{\\partial t}|\\Psi(t)\\rangle = \\hat{H}|\\Psi(t)\\rangle',
    children: [
      {
        id: 'wave-particle',
        title: 'Wave-Particle Duality',
        category: 'Wave Theory',
        description: 'Matter exhibits both particle and continuous wave characteristics.',
        details: 'Every particle or quantum entity may be described as either a particle or a wave, formalized by Louis de Broglie.',
        formula: '\\lambda = \\frac{h}{p} = \\frac{h}{mv}',
        quizQuestion: {
          question: 'If the momentum of an electron is doubled, what happens to its de Broglie wavelength?',
          options: ['It doubles', 'It halves (1/2)', 'It quadruples (4x)', 'It remains unchanged'],
          correctIndex: 1,
          explanation: 'Since wavelength λ is inversely proportional to momentum (λ = h/p), doubling momentum halves the wavelength.',
        },
        children: [
          {
            id: 'uncertainty',
            title: 'Heisenberg Uncertainty Principle',
            category: 'Fundamental Limit',
            description: 'Fundamental limit to simultaneous measurement precision.',
            details: 'The more precisely the position of some particle is determined, the less precisely its momentum can be known, and vice versa.',
            formula: '\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}',
          },
          {
            id: 'photoelectric',
            title: 'Photoelectric Effect',
            category: 'Photon Physics',
            description: 'Quantized emission of electrons upon electromagnetic irradiation.',
            details: 'Einstein demonstrated light acts as discrete packets of energy called photons.',
            formula: 'E_{photon} = h\\nu = \\Phi + K_{max}',
          },
        ],
      },
      {
        id: 'schrodinger',
        title: 'Schrödinger Wave Equation',
        category: 'Differential State',
        description: 'Governs time evolution and stationary states of quantum systems.',
        details: 'A linear partial differential equation that governs the wave function of a quantum-mechanical system.',
        formula: '-\\frac{\\hbar^2}{2m}\\nabla^2 \\psi + V(\\vec{r})\\psi = E\\psi',
        children: [
          {
            id: 'particle-in-box',
            title: '1D Infinite Potential Well',
            category: 'Quantized Energies',
            description: 'Bound state leading to discrete quantized energy levels.',
            details: 'Demonstrates how spatial confinement creates discrete non-zero ground state zero-point energy.',
            formula: 'E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2m L^2}, \\quad n=1,2,3...',
          },
          {
            id: 'quantum-tunneling',
            title: 'Quantum Tunneling',
            category: 'Wave Penetration',
            description: 'Particles penetrate through energy barriers higher than kinetic energy.',
            details: 'Crucial for nuclear fusion in stars, scanning tunneling microscopes, and flash memory transistors.',
            formula: 'T \\approx e^{-2\\kappa L}, \\quad \\kappa = \\sqrt{\\frac{2m(V_0 - E)}{\\hbar^2}}',
          },
        ],
      },
      {
        id: 'superposition',
        title: 'Superposition & Entanglement',
        category: 'Quantum Computing',
        description: 'Linear combination of eigenstates and non-local correlations.',
        details: 'States can exist simultaneously in multiple basis states until measurement collapse.',
        formula: '|\\Psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\quad |\\alpha|^2 + |\\beta|^2 = 1',
      },
    ],
  },
  calculus: {
    id: 'root-calc',
    title: 'Multivariable Calculus & Fields',
    category: 'Mathematics',
    description: 'Calculus of several variables, vector fields, and surface integrals.',
    details: 'Extends single-variable calculus to functions of multiple variables in two, three, or higher dimensions.',
    formula: '\\oint_C \\vec{F} \\cdot d\\vec{r} = \\iint_S (\\nabla \\times \\vec{F}) \\cdot d\\vec{S}',
    children: [
      {
        id: 'gradients',
        title: 'Gradient & Directional Derivatives',
        category: 'Differential Operators',
        description: 'Vector of partial derivatives pointing in the direction of greatest rate of increase.',
        details: 'Fundamental to optimization, neural network gradient descent, and conservative force fields.',
        formula: '\\nabla f = \\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z} \\right)',
      },
      {
        id: 'theorems',
        title: 'Integral Vector Theorems',
        category: 'Field Integrals',
        description: 'Stokes, Gauss Divergence, and Greens Theorems linking boundaries to volumes.',
        details: 'Provides the mathematical foundation for Maxwells Equations in electrodynamics.',
        formula: '\\oiint_S \\vec{F} \\cdot d\\vec{S} = \\iiint_V (\\nabla \\cdot \\vec{F}) dV',
      },
    ],
  },
  biology: {
    id: 'root-bio',
    title: 'Cellular Biology & Molecular Genetics',
    category: 'Life Sciences',
    description: 'Cell organelles, metabolic respiration, and central dogma of molecular biology.',
    details: 'The study of cell structure and function, revolving around the concept that the cell is the fundamental unit of life.',
    children: [
      {
        id: 'central-dogma',
        title: 'Central Dogma of Biology',
        category: 'Genetics',
        description: 'DNA replication, transcription into mRNA, and translation into functional proteins.',
        details: 'Explains the directional flow of genetic information within a biological system.',
      },
      {
        id: 'atp-synthase',
        title: 'Cellular Respiration & ATP',
        category: 'Bioenergetics',
        description: 'Glycolysis, Krebs Cycle, and Electron Transport Chain generating chemical energy.',
        details: 'Oxidative phosphorylation drives proton gradients across the mitochondrial inner membrane.',
      },
    ],
  },
};

export const MindMapStudio: React.FC = () => {
  const [currentMapKey, setCurrentMapKey] = useState<string>('quantum');
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(PRESET_MINDMAPS.quantum);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);

  const activeMap = PRESET_MINDMAPS[currentMapKey] || PRESET_MINDMAPS.quantum;

  const handleSelectNode = (node: MindNode) => {
    setSelectedNode(node);
    setQuizSelectedOption(null);
    setQuizAnswered(false);
  };

  const handleQuizAnswer = (idx: number) => {
    if (quizAnswered) return;
    setQuizSelectedOption(idx);
    setQuizAnswered(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <GitBranch className="w-3.5 h-3.5" /> Concept Graph Studio
          </div>
          <h2 className="text-2xl font-bold text-white">Interactive Knowledge Tree & Mind Map</h2>
          <p className="text-slate-300 text-xs mt-1">
            Explore interconnected academic concept topologies. Click any node to inspect equations and launch rapid check questions.
          </p>
        </div>

        {/* Topic Selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          {[
            { key: 'quantum', label: '⚛️ Quantum Mechanics' },
            { key: 'calculus', label: '📐 Multivariable Calculus' },
            { key: 'biology', label: '🧬 Molecular Biology' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setCurrentMapKey(item.key);
                setSelectedNode(PRESET_MINDMAPS[item.key]);
                setQuizSelectedOption(null);
                setQuizAnswered(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentMapKey === item.key
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Graph Viewport */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden min-h-[520px] flex flex-col justify-between shadow-2xl">
          {/* Canvas Background Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Floating Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-1.5 rounded-2xl shadow-lg">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-emerald-400 px-1 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Hierarchical Node Graph Renderer */}
          <div
            className="w-full flex-1 flex flex-col items-center justify-center transition-transform duration-300 origin-center py-6"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Level 0: Root Node */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectNode(activeMap)}
              className={`px-5 py-3 rounded-2xl border transition-all shadow-xl text-center relative z-20 ${
                selectedNode?.id === activeMap.id
                  ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-500/30'
                  : 'bg-slate-900/90 text-white border-emerald-500/50 hover:border-emerald-400'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                {activeMap.category}
              </span>
              <span className="font-extrabold text-sm">{activeMap.title}</span>
            </motion.button>

            {/* Connecting Vertical Line */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-700/60" />

            {/* Level 1: Primary Branches */}
            <div className="w-full flex justify-center gap-4 flex-wrap relative z-10">
              {activeMap.children?.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectNode(child)}
                    className={`px-4 py-2.5 rounded-2xl border transition-all shadow-md text-center max-w-[200px] ${
                      selectedNode?.id === child.id
                        ? 'bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-400'
                        : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 block truncate">
                      {child.category}
                    </span>
                    <span className="font-bold text-xs truncate block">{child.title}</span>
                  </motion.button>

                  {/* Level 2 Sub-branches if present */}
                  {child.children && child.children.length > 0 && (
                    <>
                      <div className="w-0.5 h-6 bg-slate-700" />
                      <div className="flex gap-2">
                        {child.children.map((subChild) => (
                          <motion.button
                            key={subChild.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectNode(subChild)}
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all truncate max-w-[140px] ${
                              selectedNode?.id === subChild.id
                                ? 'bg-cyan-600 text-white border-cyan-300 ring-2 ring-cyan-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-600'
                            }`}
                          >
                            {subChild.title}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Guide */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-900 relative z-10">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Click any node to open its concept dossier & test drill
            </span>
            <span className="text-[10px] text-slate-600">FuturoVerse Topology Graph v2.5</span>
          </div>
        </div>

        {/* Node Deep Dive & Quiz Drawer */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Node Title & Badge */}
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block mb-1.5">
                  {selectedNode.category}
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">{selectedNode.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedNode.description}</p>
              </div>

              {/* Formula Card if available */}
              {selectedNode.formula && (
                <div className="p-3 bg-slate-950/60 border border-emerald-500/30 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Fundamental Formula:
                  </span>
                  <MathRenderer content={`$$${selectedNode.formula}$$`} />
                </div>
              )}

              {/* Extended Details */}
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed">
                <p>{selectedNode.details}</p>
              </div>

              {/* Node Mini-Check Quiz */}
              {selectedNode.quizQuestion ? (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white">Concept Verification Drill</h4>
                  </div>
                  <p className="text-xs font-medium text-slate-200">
                    {selectedNode.quizQuestion.question}
                  </p>

                  <div className="space-y-1.5">
                    {selectedNode.quizQuestion.options.map((opt, oIdx) => {
                      const isSelected = quizSelectedOption === oIdx;
                      const isCorrect = oIdx === selectedNode.quizQuestion?.correctIndex;

                      let btnStyle = 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600';
                      if (quizAnswered) {
                        if (isCorrect) btnStyle = 'bg-emerald-600/30 text-emerald-200 border-emerald-500 font-bold';
                        else if (isSelected && !isCorrect) btnStyle = 'bg-rose-900/30 text-rose-200 border-rose-500';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleQuizAnswer(oIdx)}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {quizAnswered && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          {quizAnswered && isSelected && !isCorrect && <X className="w-3.5 h-3.5 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {quizAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-[11px] text-slate-300"
                    >
                      <span className="font-bold text-emerald-400 block mb-0.5">Explanation:</span>
                      {selectedNode.quizQuestion.explanation}
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-center">
                  <span className="text-xs text-slate-500">Connected to 2 child theorems</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <BookOpen className="w-8 h-8 mb-2" />
              <p className="text-xs">Select any node on the left to inspect detailed formulations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
