'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { saveAiConversationAction, submitInquiryAction } from '@/lib/supabase/actions';
import { Service, PortfolioProject, ProjectType } from '@/lib/supabase/queries';

interface AiAssistantProps {
  services: Service[];
  projects: PortfolioProject[];
  projectTypes: ProjectType[];
}

interface Message {
  sender: 'bot' | 'user';
  text: string;
  type?: 'text' | 'options' | 'suggestions' | 'form';
  options?: string[];
  recommendations?: {
    suggestions: string[];
    services: Service[];
    projects: PortfolioProject[];
  };
}

export function AiAssistant({ services, projects, projectTypes }: AiAssistantProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [sessionId, setSessionId] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [step, setStep] = React.useState(0); // 0: init, 1: propertyType, 2: size, 3: budget, 4: style, 5: timeline, 6: finished
  
  // Intake answers
  const [answers, setAnswers] = React.useState({
    propertyType: '',
    spaceSize: '',
    budget: '',
    stylePreference: '',
    timeline: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
  });

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Generate Session ID once on mount
  React.useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  // Scroll to bottom when messages list changes
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Start intake chat flow
  const startConsultation = () => {
    setStep(1);
    setMessages([
      {
        sender: 'bot',
        text: 'Hello! I am your AI Design Assistant. Let us customize your design experience. What type of property is this?',
        type: 'options',
        options: ['Residential', 'Commercial', 'Retail'],
      },
    ]);
  };

  // Helper to log conversation progress
  const logProgress = async (updatedAnswers = answers, updatedMessages = messages) => {
    if (!sessionId) return;
    await saveAiConversationAction({
      sessionId,
      metadata: {
        property_type: updatedAnswers.propertyType,
        space_size: updatedAnswers.spaceSize,
        budget: updatedAnswers.budget,
        style_preference: updatedAnswers.stylePreference,
        timeline: updatedAnswers.timeline,
        client_name: updatedAnswers.clientName,
        client_email: updatedAnswers.clientEmail,
        client_phone: updatedAnswers.clientPhone,
        messages: updatedMessages.map(m => ({ sender: m.sender, text: m.text })),
      },
    });
  };

  const handleOptionSelect = (option: string) => {
    // Add user response message
    const userMsg: Message = { sender: 'user', text: option };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    let nextStep = step + 1;
    let nextBotMsg: Message;
    const newAnswers = { ...answers };

    if (step === 1) {
      newAnswers.propertyType = option;
      nextBotMsg = {
        sender: 'bot',
        text: 'Got it. What is the approximate size of the space (in square feet)?',
        type: 'options',
        options: ['Under 500 sq ft', '500 - 1,500 sq ft', '1,500+ sq ft'],
      };
    } else if (step === 2) {
      newAnswers.spaceSize = option;
      nextBotMsg = {
        sender: 'bot',
        text: 'Excellent. What is your estimated budget for this design project?',
        type: 'options',
        options: ['Under $5,000', '$5,000 - $15,000', '$15,000+'],
      };
    } else if (step === 3) {
      newAnswers.budget = option;
      nextBotMsg = {
        sender: 'bot',
        text: 'Perfect. What is your preferred design style?',
        type: 'options',
        options: ['Modern', 'Biophilic', 'Luxury', 'Minimalist'],
      };
    } else if (step === 4) {
      newAnswers.stylePreference = option;
      nextBotMsg = {
        sender: 'bot',
        text: 'Lastly, what is your target timeline for execution?',
        type: 'options',
        options: ['Immediate', '1 - 3 months', '6+ months'],
      };
    } else if (step === 5) {
      newAnswers.timeline = option;
      nextStep = 6; // Finished
      
      // Calculate Recommendations
      const selectedStyle = newAnswers.stylePreference.toLowerCase();
      const isHighBudget = newAnswers.budget.includes('$15,000');
      
      // Filter matching Services
      const matchedServices = services
        .filter((s) => {
          const desc = s.short_description.toLowerCase();
          const title = s.title.toLowerCase();
          return desc.includes(selectedStyle) || title.includes(selectedStyle) || (isHighBudget && title.includes('luxury'));
        })
        .slice(0, 2);

      const finalServices = matchedServices.length > 0 ? matchedServices : services.slice(0, 2);

      // Filter matching Projects
      const matchedProjects = projects
        .filter((p) => {
          const desc = (p.description ?? '').toLowerCase();
          const name = p.name.toLowerCase();
          return desc.includes(selectedStyle) || name.includes(selectedStyle) || desc.includes(newAnswers.propertyType.toLowerCase());
        })
        .slice(0, 2);

      const finalProjects = matchedProjects.length > 0 ? matchedProjects : projects.slice(0, 2);

      // Generate suggestions message
      nextBotMsg = {
        sender: 'bot',
        text: `Here is your customized design summary: For your ${newAnswers.spaceSize} ${newAnswers.stylePreference} ${newAnswers.propertyType} project within a timeline of ${newAnswers.timeline}, we suggest prioritizing ambient lighting, tailored zoning, and custom finishes to maximize layout flow.`,
        type: 'suggestions',
        recommendations: {
          suggestions: [
            `Utilize ${newAnswers.stylePreference === 'Minimalist' ? 'low-profile modular furniture' : 'vibrant organic textures'} to enhance spatial volume.`,
            `Configure soft lighting zones mapped to layout pathways.`,
          ],
          services: finalServices,
          projects: finalProjects,
        },
      };
    } else {
      return;
    }

    setAnswers(newAnswers);
    setStep(nextStep);
    
    // Add bot response with delay
    setTimeout(() => {
      const finalMsgs = [...nextMessages, nextBotMsg];
      setMessages(finalMsgs);
      logProgress(newAnswers, finalMsgs);
    }, 600);
  };

  const handleCustomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const text = inputText.trim();
    setInputText('');
    
    // Process input as selected option for standard flow
    if (step >= 1 && step <= 5) {
      handleOptionSelect(text);
    } else {
      // General conversation
      const userMsg: Message = { sender: 'user', text };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);

      setTimeout(() => {
        const botMsg: Message = {
          sender: 'bot',
          text: 'Thank you. I have logged that. Select from the options below or let me know how I can help you further.',
        };
        const finalMsgs = [...nextMessages, botMsg];
        setMessages(finalMsgs);
        logProgress(answers, finalMsgs);
      }, 600);
    }
  };

  const handleActionClick = (actionType: 'save' | 'email' | 'book') => {
    let text = '';
    let formFields: Message;

    if (actionType === 'save') {
      text = 'I would like to save this conversation.';
      formFields = {
        sender: 'bot',
        text: 'Please provide your name and email to save this consultation transcript.',
        type: 'form',
      };
    } else if (actionType === 'email') {
      text = 'Please email me this transcript.';
      formFields = {
        sender: 'bot',
        text: 'Please enter your email address to send the chat logs.',
        type: 'form',
      };
    } else {
      text = 'I would like to book a direct design consultation.';
      formFields = {
        sender: 'bot',
        text: 'Fill out your contact details below to submit a direct design booking to our designers.',
        type: 'form',
      };
    }

    const userMsg: Message = { sender: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    setTimeout(() => {
      const finalMsgs = [...nextMessages, formFields];
      setMessages(finalMsgs);
      logProgress(answers, finalMsgs);
    }, 600);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, formType: 'save' | 'email' | 'book') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name')?.toString() || 'Anonymous';
    const email = formData.get('email')?.toString() || '';
    const phone = formData.get('phone')?.toString() || '';

    const newAnswers = {
      ...answers,
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
    };
    setAnswers(newAnswers);

    // Format chat log transcript
    const transcript = messages
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n\n');

    // Add confirmation message
    const confirmMsg: Message = {
      sender: 'bot',
      text: 'Thank you! Your information has been processed. Our design team will contact you shortly.',
    };

    setMessages((prev) => [...prev, confirmMsg]);

    // Save logs to database
    await saveAiConversationAction({
      sessionId,
      metadata: {
        property_type: newAnswers.propertyType,
        space_size: newAnswers.spaceSize,
        budget: newAnswers.budget,
        style_preference: newAnswers.stylePreference,
        timeline: newAnswers.timeline,
        client_name: newAnswers.clientName,
        client_email: newAnswers.clientEmail,
        client_phone: newAnswers.clientPhone,
        messages: [...messages, confirmMsg].map(m => ({ sender: m.sender, text: m.text })),
      },
    });

    if (formType === 'book' || formType === 'save') {
      // Find matching project type or fallback to first
      const matchedProjType = projectTypes.find(
        (t) => t.name.toLowerCase().includes(newAnswers.propertyType.toLowerCase())
      ) || projectTypes[0];

      // Submit lead to CRM inquiries
      await submitInquiryAction({
        name,
        email,
        phone_number: phone || '00000000',
        project_type_id: matchedProjType?.id || '',
        source: 'consultation_popup',
        message: `AI Consultation Intake Transcript:\n\nStyle: ${newAnswers.stylePreference}\nBudget: ${newAnswers.budget}\nSize: ${newAnswers.spaceSize}\n\nTranscript History:\n${transcript}`,
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      
      {/* Floating button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && messages.length === 0) startConsultation();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle Design Assistant"
        className="h-14 w-14 rounded-full bg-gradient-to-r from-[#C9A86A] via-[#E4C892] to-[#C9A86A] text-[#111111] flex items-center justify-center shadow-[0_4px_20px_rgba(201,168,106,0.35)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[400px] h-[550px] bg-[#161616] border border-[#C9A86A]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#C9A86A]/10 bg-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1 rounded-lg bg-[#C9A86A]/15 text-[#C9A86A]">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-white leading-none">Design Assistant</h3>
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5 block">Online • Live AI</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#C9A86A] to-[#E4C892] text-[#111111] font-medium rounded-tr-none'
                        : 'bg-[#222222] border border-gray-800 text-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Render Options */}
                  {msg.sender === 'bot' && msg.type === 'options' && msg.options && (
                    <div className="flex flex-wrap gap-2 pt-1 w-full max-w-[85%]">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOptionSelect(opt)}
                          className="px-3.5 py-1.5 text-xs rounded-full border border-[#C9A86A]/30 text-[#C9A86A] bg-transparent hover:bg-[#C9A86A]/5 transition-all cursor-pointer focus:outline-none"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Render dynamic recommendations */}
                  {msg.sender === 'bot' && msg.type === 'suggestions' && msg.recommendations && (
                    <div className="w-full max-w-[90%] space-y-4 pt-3 select-text">
                      {/* Custom suggestion advice bullets */}
                      <ul className="space-y-1.5 pl-2 border-l border-[#C9A86A]/30 text-xs text-gray-400">
                        {msg.recommendations.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#C9A86A] mt-0.5">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>

                      {/* Matching live database Services recommendations */}
                      <div className="space-y-2 select-none">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block">Recommended Services</span>
                        <div className="grid grid-cols-2 gap-2">
                          {msg.recommendations.services.map((s) => (
                            <a
                              key={s.id}
                              href={`/services/${s.slug}`}
                              className="p-2 rounded bg-[#1C1C1C] border border-white/5 hover:border-[#C9A86A]/40 transition-colors flex flex-col text-left space-y-1 group"
                            >
                              <span className="text-xs font-medium text-white group-hover:text-[#C9A86A] transition-colors truncate">
                                {s.title}
                              </span>
                              <span className="text-[9px] text-gray-500 line-clamp-1">
                                View Service
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Matching live database Portfolio Projects recommendations */}
                      <div className="space-y-2 select-none">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block">Suggested Projects</span>
                        <div className="grid grid-cols-2 gap-2">
                          {msg.recommendations.projects.map((p) => (
                            <a
                              key={p.id}
                              href={`/portfolio/${p.slug}`}
                              className="p-2 rounded bg-[#1C1C1C] border border-white/5 hover:border-[#C9A86A]/40 transition-colors flex flex-col text-left space-y-1 group"
                            >
                              <span className="text-xs font-medium text-white group-hover:text-[#C9A86A] transition-colors truncate">
                                {p.name}
                              </span>
                              <span className="text-[9px] text-gray-500 line-clamp-1">
                                View Project
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Post-Intake Next Actions Triggers */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-800/60 select-none">
                        <button
                          onClick={() => handleActionClick('save')}
                          className="w-full text-center py-2 bg-[#222222] border border-gray-800 rounded-lg text-xs text-white hover:border-[#C9A86A]/30 transition-all cursor-pointer"
                        >
                          Save Conversation
                        </button>
                        <button
                          onClick={() => handleActionClick('email')}
                          className="w-full text-center py-2 bg-[#222222] border border-gray-800 rounded-lg text-xs text-white hover:border-[#C9A86A]/30 transition-all cursor-pointer"
                        >
                          Email Transcript
                        </button>
                        <button
                          onClick={() => handleActionClick('book')}
                          className="w-full text-center py-2.5 bg-[#C9A86A] text-[#111111] font-bold rounded-lg text-xs hover:bg-[#C9A86A]/95 transition-all cursor-pointer"
                        >
                          Book Design Consultation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render Actions Intake Form */}
                  {msg.sender === 'bot' && msg.type === 'form' && (
                    <form
                      onSubmit={(e) => {
                        const isBook = msg.text.includes('booking');
                        const isSave = msg.text.includes('transcript');
                        handleFormSubmit(e, isBook ? 'book' : isSave ? 'save' : 'email');
                      }}
                      className="w-full max-w-[85%] bg-[#1E1E1E] border border-gray-800 rounded-xl p-4 mt-1.5 space-y-3"
                    >
                      {msg.text.includes('name') && (
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">Your Name</label>
                          <input
                            type="text"
                            name="name"
                            required
                            placeholder="John Doe"
                            className="w-full px-3 py-1.5 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="john@example.com"
                          className="w-full px-3 py-1.5 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
                        />
                      </div>
                      {msg.text.includes('booking') && (
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-3 py-1.5 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
                          />
                        </div>
                      )}
                      <Button type="submit" size="sm" className="w-full bg-[#C9A86A] text-[#111111] text-xs font-semibold py-1.5">
                        Submit
                      </Button>
                    </form>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Footer Form Input */}
            <form
              onSubmit={handleCustomInputSubmit}
              className="p-3 bg-[#1A1A1A] border-t border-[#C9A86A]/10 flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={step > 0 && step <= 5 ? 'Select option above or reply...' : 'Type a message...'}
                className="flex-1 bg-[#111111] border border-gray-800 text-xs rounded-xl px-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] transition-colors"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#C9A86A] to-[#E4C892] text-[#111111] hover:opacity-90 cursor-pointer transition-opacity"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
