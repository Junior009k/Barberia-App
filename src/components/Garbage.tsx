import { getTranslation } from "@/translations";
import { Client, DiscountCode, Locale } from "@/types";
import { GoogleGenAI } from "@google/genai";
import { useState } from "react";

interface MarketingToolsProps {
    language: Locale;
    clients: Client[];
    discountCodes: DiscountCode[];
    onCreateDiscountCode: (code: Omit<DiscountCode, 'id' | 'isActive'>) => Promise<void>;
    onDeleteDiscountCode: (codeId: string) => Promise<void>;
    isLoading: boolean;
  }
  
  const MarketingTools: React.FC<MarketingToolsProps> = ({ language, clients, discountCodes, onCreateDiscountCode, onDeleteDiscountCode, isLoading }) => {
      const [activeTab, setActiveTab] = useState<'email' | 'discounts'>('email');
      
      // Email state
      const [emailSubject, setEmailSubject] = useState('');
      const [emailBody, setEmailBody] = useState('');
      const [aiPrompt, setAiPrompt] = useState('');
      const [isGenerating, setIsGenerating] = useState(false);
      const [isSending, setIsSending] = useState(false);
      const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  
  
      // Discount code state
      const [code, setCode] = useState('');
      const [discount, setDiscount] = useState('');
      const [expiry, setExpiry] = useState('');
  
      const handleClientToggle = (clientId: string) => {
          setSelectedClientIds(prev => {
              const newSet = new Set(prev);
              if (newSet.has(clientId)) {
                  newSet.delete(clientId);
              } else {
                  newSet.add(clientId);
              }
              return newSet;
          });
      };
  
      const handleSelectAllToggle = () => {
          if (selectedClientIds.size === clients.length) {
              setSelectedClientIds(new Set()); // deselect all
          } else {
              setSelectedClientIds(new Set(clients.map(c => c.id))); // select all
          }
      };
  
      const handleGenerateContent = async () => {
          if (!aiPrompt && !emailSubject) {
              alert(getTranslation('aiPromptPlaceholder', language));
              return;
          }
          setIsGenerating(true);
          try {
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const fullPrompt = `You are a marketing expert for a barbershop called "LUCIA APP". Your tone should be friendly, exciting, and professional. Generate a promotional email body based on the following instruction or offer: "${aiPrompt}". The subject line for the email is: "${emailSubject}". The email should be concise, under 120 words, and must include a clear call to action to book an appointment. Do not include a subject line or greeting (e.g., "Hi [Name],") in your response, only the body text.`;
              
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-preview-04-17',
                  contents: fullPrompt,
              });

          } catch (error) {
              console.error("Error generating AI content:", error);
              alert("Failed to generate AI content. See console for details.");
          } finally {
              setIsGenerating(false);
          }
      };
      
      const handleSendCampaign = async () => {
          if (!emailSubject || !emailBody) {
              alert(getTranslation('emailFieldsRequired', language));
              return;
          }
          if (selectedClientIds.size === 0) {
              alert(getTranslation('noClientsSelectedError', language));
              return;
          }
  
          const selectedClients = clients.filter(c => selectedClientIds.has(c.id));
          const confirmMessage = getTranslation('sendCampaignConfirm', language).replace('{count}', String(selectedClients.length));
  
          if (window.confirm(confirmMessage)) {
              setIsSending(true);
              try {
                  await apiSendPromotionalEmail(emailSubject, emailBody, selectedClients);
                  alert(getTranslation('campaignSentSuccess', language));
                  setEmailSubject('');
                  setEmailBody('');
                  setAiPrompt('');
                  setSelectedClientIds(new Set());
              } catch (e) {
                  alert(getTranslation('campaignSentError', language));
                  console.error(e);
              } finally {
                  setIsSending(false);
              }
          }
      };
  
      const handleCreateCode = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!code || !discount || !expiry) return;
          await onCreateDiscountCode({
              code: code.toUpperCase(),
              discountPercentage: parseInt(discount, 10),
              expiryDate: new Date(expiry)
          });
          setCode('');
          setDiscount('');
          setExpiry('');
      };
  
      return (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">{getTranslation('marketingToolsTitle', language)}</h2>
              <div className="flex border-b border-slate-700 mb-6">
                  <button onClick={() => setActiveTab('email')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'email' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}>{getTranslation('emailCampaignsTab', language)}</button>
                  <button onClick={() => setActiveTab('discounts')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'discounts' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}>{getTranslation('discountCodesTab', language)}</button>
              </div>
  
              {activeTab === 'email' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-200">{getTranslation('emailCampaignsTab', language)}</h3>
                          <div>
                              <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('emailSubjectLabel', language)}</label>
                              <input type="text" id="subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none" />
                          </div>
                          <div>
                              <label htmlFor="aiPrompt" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('aiPromptLabel', language)}</label>
                              <div className="flex gap-2">
                                  <input type="text" id="aiPrompt" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder={getTranslation('aiPromptPlaceholder', language)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none" />
                                  <button onClick={handleGenerateContent} disabled={isGenerating} className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm">{isGenerating ? getTranslation('generatingContent', language) : getTranslation('generateWithAI', language)}</button>
                              </div>
                          </div>
                          <div>
                              <label htmlFor="body" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('emailBodyLabel', language)}</label>
                              <textarea id="body" rows={6} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none" />
                          </div>
                          
                          <div className='space-y-2'>
                              <label className="block text-sm font-medium text-slate-300">{getTranslation('recipientsLabel', language)}</label>
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-600 mb-2 sticky top-0 bg-slate-900">
                                      <label htmlFor="selectAllClients" className="flex items-center text-sm text-slate-300 cursor-pointer">
                                          <input
                                              type="checkbox"
                                              id="selectAllClients"
                                              checked={clients.length > 0 && selectedClientIds.size === clients.length}
                                              onChange={handleSelectAllToggle}
                                              className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-amber-600 focus:ring-amber-500 mr-2"
                                          />
                                          {getTranslation('selectAllLabel', language)}
                                      </label>
                                      <span className="text-xs text-slate-400">{selectedClientIds.size} / {clients.length} {getTranslation('selectedLabel', language)}</span>
                                  </div>
                                  <div className="space-y-1">
                                      {clients.map(client => (
                                          <label key={client.id} htmlFor={`client-${client.id}`} className="flex items-center text-sm text-slate-300 hover:bg-slate-700 p-1.5 rounded-md cursor-pointer transition-colors">
                                              <input
                                                  type="checkbox"
                                                  id={`client-${client.id}`}
                                                  checked={selectedClientIds.has(client.id)}
                                                  onChange={() => handleClientToggle(client.id)}
                                                  className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-amber-600 focus:ring-amber-500 mr-3"
                                              />
                                              <span>{client.name} <span className="text-slate-400">({client.email})</span></span>
                                          </label>
                                      ))}
                                      {clients.length === 0 && <p className="text-slate-500 text-center text-sm py-2">{getTranslation('noClientsAvailable', language)}</p>}
                                  </div>
                              </div>
                          </div>
  
                          <button 
                              onClick={handleSendCampaign} 
                              disabled={isLoading || isSending || selectedClientIds.size === 0} 
                              className="w-full bg-amber-500 text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isSending 
                                  ? getTranslation('sendingButton', language) 
                                  : getTranslation('sendToNLabel', language).replace('{count}', String(selectedClientIds.size))
                              }
                          </button>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-lg">
                          <h4 className="text-md font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-2">Preview</h4>
                          <p className="text-sm text-slate-400 mb-4">Subject: {emailSubject || `(${getTranslation('emailSubjectLabel', language)})`}</p>
                          <div className="prose prose-sm prose-invert max-w-none">
                              <p>Hi [Client Name],</p>
                              <p>{emailBody || `(${getTranslation('emailBodyLabel', language)})`}</p>
                              <p>We look forward to seeing you!</p>
                              <p>Barberia App</p>
                          </div>
                      </div>
                  </div>
              )}
              
              {activeTab === 'discounts' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <h3 className="text-lg font-semibold text-slate-200 mb-4">{getTranslation('createDiscountCodeTitle', language)}</h3>
                          <form onSubmit={handleCreateCode} className="space-y-4">
                              <div>
                                  <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('codeLabel', language)}</label>
                                  <input type="text" id="code" value={code} onChange={e => setCode(e.target.value)} required className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none uppercase placeholder:capitalize" />
                              </div>
                              <div className="flex gap-4">
                                  <div className="flex-1">
                                      <label htmlFor="discount" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('discountPercentageLabel', language)}</label>
                                      <input type="number" id="discount" value={discount} onChange={e => setDiscount(e.target.value)} min="1" max="100" required className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none" />
                                  </div>
                                  <div className="flex-1">
                                      <label htmlFor="expiry" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('expiryDateLabel', language)}</label>
                                      <input type="date" id="expiry" value={expiry} onChange={e => setExpiry(e.target.value)} required min={new Date().toISOString().split("T")[0]} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none" />
                                  </div>
                              </div>
                              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50">{getTranslation('createCodeButton', language)}</button>
                          </form>
                      </div>
                       <div>
                          <h3 className="text-lg font-semibold text-slate-200 mb-4">{getTranslation('activeDiscountCodes', language)}</h3>
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                              {discountCodes.length > 0 ? discountCodes.map(dc => (
                                  <div key={dc.id} className="bg-slate-700 p-3 rounded-md flex justify-between items-center">
                                      <div>
                                          <p className="font-mono font-bold text-amber-400">{dc.code}</p>
                                          <p className="text-sm text-slate-300">{dc.discountPercentage}% off - Expires {new Date(dc.expiryDate).toLocaleDateString(language)}</p>
                                      </div>
                                      <button onClick={() => onDeleteDiscountCode(dc.id)} disabled={isLoading} className="text-red-400 hover:text-red-300 disabled:opacity-50">&times;</button>
                                  </div>
                              )) : <p className="text-slate-400">{getTranslation('noDiscountCodes', language)}</p>}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };



const Garbage: React.FC<any> = ()=>{

    return(
        <></>
    );
}


export default Garbage

function apiSendPromotionalEmail(emailSubject: any, emailBody: any, selectedClients: Client[]) {
    throw new Error("Function not implemented.");
}
