import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Calendar, 
  Clock, 
  PlusCircle, 
  ToggleLeft,
  ToggleRight,
  Loader2,
  Lock,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const PREDEFINED_FIELDS = [
  { name: 'Photo', label: 'Show Candidate Photo', type: 'IMAGE' },
  { name: 'Candidate Name', label: 'Show Candidate Name', type: 'TEXT', defaultRequired: true },
  { name: 'Party Name', label: 'Show Party Name', type: 'TEXT' },
  { name: 'Party Symbol', label: 'Show Party Symbol', type: 'IMAGE' },
  { name: 'Candidate Symbol', label: 'Show Candidate Symbol', type: 'IMAGE' },
  { name: 'Age', label: 'Show Age', type: 'NUMBER' },
  { name: 'Gender', label: 'Show Gender', type: 'TEXT' },
  { name: 'Qualification', label: 'Show Qualification', type: 'TEXT' },
  { name: 'Occupation', label: 'Show Occupation', type: 'TEXT' },
  { name: 'Experience', label: 'Show Experience', type: 'TEXT' },
  { name: 'Manifesto', label: 'Show Manifesto Textarea', type: 'TEXTAREA' },
  { name: 'Biography', label: 'Show Biography Textarea', type: 'TEXTAREA' },
  { name: 'Vision', label: 'Show Vision Textarea', type: 'TEXTAREA' },
  { name: 'Contact Information', label: 'Show Contact Details', type: 'TEXT' },
  { name: 'Social Media Links', label: 'Show Social Links', type: 'URL' },
  { name: 'Short Description', label: 'Show Short Description', type: 'TEXT' },
  { name: 'Long Description', label: 'Show Long Description', type: 'TEXTAREA' },
  { name: 'Candidate Number', label: 'Show Candidate Number', type: 'NUMBER' },
  { name: 'Custom Badge', label: 'Show Custom Badge Tag', type: 'TEXT' },
];

export default function CreateElection() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      type: 'College Election',
      startDate: '',
      endDate: '',
      votingStartTime: '09:00',
      votingEndTime: '17:00',
      maxVotesAllowed: 1,
      allowMultiplePositions: false,
      isPublic: true,
      bannerUrl: '',
      instructions: '',
      rules: '',
    }
  });

  const isPublicVal = watch('isPublic');

  const [enabledToggles, setEnabledToggles] = useState({
    'Candidate Name': true,
    'Photo': true,
    'Party Name': true,
    'Manifesto': true,
  });

  const [customFields, setCustomFields] = useState([]);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldType, setCustomFieldType] = useState('TEXT');
  const [customFieldRequired, setCustomFieldRequired] = useState(false);
  const [customFieldVisible, setCustomFieldVisible] = useState(true);

  const [eligibilityDomains, setEligibilityDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [eligibilityEmails, setEligibilityEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');

  const togglePredefinedField = (name) => {
    if (name === 'Candidate Name') return;
    setEnabledToggles((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleAddCustomField = () => {
    if (!customFieldName.trim()) {
      toast.error('Field name cannot be empty');
      return;
    }
    const cleanName = customFieldName.trim();
    
    if (PREDEFINED_FIELDS.some(f => f.name.toLowerCase() === cleanName.toLowerCase()) || 
        customFields.some(f => f.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error('A field with this name already exists');
      return;
    }

    setCustomFields([
      ...customFields,
      {
        name: cleanName,
        type: customFieldType,
        isRequired: customFieldRequired,
        isVisibleOnCard: customFieldVisible,
        isCustom: true,
      }
    ]);
    
    setCustomFieldName('');
    setCustomFieldType('TEXT');
    setCustomFieldRequired(false);
    setCustomFieldVisible(true);
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const handleAddDomain = () => {
    if (!newDomain.trim() || !newDomain.includes('.')) {
      toast.error('Please enter a valid domain (e.g. college.edu)');
      return;
    }
    if (eligibilityDomains.includes(newDomain.trim().toLowerCase())) return;
    setEligibilityDomains([...eligibilityDomains, newDomain.trim().toLowerCase()]);
    setNewDomain('');
  };

  const handleRemoveDomain = (domain) => {
    setEligibilityDomains(eligibilityDomains.filter((d) => d !== domain));
  };

  const handleAddEmail = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (eligibilityEmails.includes(newEmail.trim().toLowerCase())) return;
    setEligibilityEmails([...eligibilityEmails, newEmail.trim().toLowerCase()]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email) => {
    setEligibilityEmails(eligibilityEmails.filter((e) => e !== email));
  };

  const onSubmit = async (data) => {
    setSubmitting(true);

    const fieldDefinitions = [];
    PREDEFINED_FIELDS.forEach((field) => {
      if (enabledToggles[field.name]) {
        fieldDefinitions.push({
          name: field.name,
          type: field.type,
          isRequired: field.defaultRequired ?? false,
          isVisibleOnCard: true,
          isCustom: false,
        });
      }
    });

    fieldDefinitions.push(...customFields);

    const eligibilities = [];
    eligibilityDomains.forEach((domain) => {
      eligibilities.push({ emailDomain: domain, specificEmail: null });
    });
    eligibilityEmails.forEach((email) => {
      eligibilities.push({ emailDomain: null, specificEmail: email });
    });

    try {
      const payload = {
        ...data,
        maxVotesAllowed: parseInt(data.maxVotesAllowed, 10),
        fieldDefinitions,
        eligibilities: !data.isPublic ? eligibilities : [],
      };

      const res = await api.post('/elections', payload);
      toast.success(res.data.message || 'Election draft created!');
      navigate(`/admin/election/${res.data.election.id}/candidates`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create election.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Create Customizable Election</h1>
        <p className="text-slate-400 text-sm font-light">Set date thresholds, configure candidate field details, and build custom rosters.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Settings className="h-4.5 w-4.5 text-brand-primary" /> Basic Configuration
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 font-medium">Election Label Name</label>
              <input
                type="text"
                {...register('name', { required: 'Election name is required' })}
                placeholder="2026 Student council Presidential Election"
                className="glass-input h-11 px-3 rounded-lg text-sm"
              />
              {errors.name && <span className="text-xs text-red-400">{errors.name.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Election Type</label>
                <input
                  type="text"
                  {...register('type', { required: 'Election type is required' })}
                  placeholder="College, Board, Club etc."
                  className="glass-input h-11 px-3 rounded-lg text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Max Votes Per Voter</label>
                <input
                  type="number"
                  min={1}
                  {...register('maxVotesAllowed', { required: true, min: 1 })}
                  className="glass-input h-11 px-3 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Brief Overview / Description</label>
            <textarea
              rows={3}
              {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Must be at least 10 chars' } })}
              placeholder="Provide information regarding the objective and scope of this ballot..."
              className="glass-input p-3 rounded-lg text-sm resize-none"
            ></textarea>
            {errors.description && <span className="text-xs text-red-400">{errors.description.message}</span>}
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</label>
              <input type="date" {...register('startDate', { required: 'Required' })} className="glass-input h-11 px-3 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</label>
              <input type="date" {...register('endDate', { required: 'Required' })} className="glass-input h-11 px-3 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Daily Voting Start</label>
              <input type="time" {...register('votingStartTime', { required: 'Required' })} className="glass-input h-11 px-3 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Daily Voting End</label>
              <input type="time" {...register('votingEndTime', { required: 'Required' })} className="glass-input h-11 px-3 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-brand-primary" /> Candidate Fields Configuration
            </h3>
            <p className="text-xs text-slate-400 font-light mt-1">Select which candidate attributes will render on the creation form and voter card.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PREDEFINED_FIELDS.map((field) => {
              const enabled = enabledToggles[field.name] || false;
              const isName = field.name === 'Candidate Name';
              return (
                <div 
                  key={field.name}
                  onClick={() => !isName && togglePredefinedField(field.name)}
                  className={`flex justify-between items-center p-3 rounded-lg border text-sm transition-all select-none ${
                    isName 
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-white cursor-not-allowed'
                      : enabled 
                        ? 'bg-slate-900/60 border-brand-primary/40 text-white cursor-pointer hover:border-brand-primary/60' 
                        : 'bg-slate-950/20 border-white/5 text-slate-400 cursor-pointer hover:bg-slate-900/20'
                  }`}
                >
                  <span className="font-medium">{field.label}</span>
                  {enabled ? (
                    <ToggleRight className="h-5 w-5 text-brand-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-slate-950/40 p-5 rounded-lg border border-white/5 flex flex-col gap-4 mt-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dynamic Custom Field Builder</h4>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Field Label</label>
                <input 
                  type="text" 
                  value={customFieldName} 
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  placeholder="e.g. Blood Group, Semester" 
                  className="glass-input h-10 px-3 rounded-lg text-xs" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Field Type</label>
                <select 
                  value={customFieldType} 
                  onChange={(e) => setCustomFieldType(e.target.value)}
                  className="glass-input h-10 px-3 rounded-lg text-xs bg-slate-950"
                >
                  <option value="TEXT">Text input</option>
                  <option value="NUMBER">Number input</option>
                  <option value="DATE">Date picker</option>
                  <option value="URL">Web URL</option>
                  <option value="IMAGE">Image File / URL</option>
                  <option value="TEXTAREA">Textarea</option>
                </select>
              </div>

              <div className="flex gap-4 h-10 items-center justify-start text-xs select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={customFieldRequired} 
                    onChange={(e) => setCustomFieldRequired(e.target.checked)}
                    className="rounded border-white/10 text-brand-primary focus:ring-0 focus:ring-offset-0 bg-slate-900" 
                  />
                  <span>Required?</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={customFieldVisible} 
                    onChange={(e) => setCustomFieldVisible(e.target.checked)}
                    className="rounded border-white/10 text-brand-primary focus:ring-0 focus:ring-offset-0 bg-slate-900" 
                  />
                  <span>Visible on Card?</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleAddCustomField}
                className="h-10 bg-brand-secondary hover:bg-brand-secondary/95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Field
              </button>
            </div>

            {customFields.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/5">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase">Configured Custom Fields</h5>
                <div className="flex flex-wrap gap-2">
                  {customFields.map((f, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-2 bg-slate-900 border border-white/5 pl-2.5 pr-1.5 py-1.5 rounded-lg text-xs"
                    >
                      <span className="text-white font-medium">{f.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">({f.type})</span>
                      {f.isRequired && <span className="text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-500/10">Required</span>}
                      {f.isVisibleOnCard && <span className="text-[9px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-500/10">Card</span>}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCustomField(index)}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <div className="border-b border-white/5 pb-3 flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-brand-primary" /> Voter Eligibility Rules
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1">Restrict voting parameters. Setting to Private locks ballots unless domain or email checks pass.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900 border border-white/5 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setValue('isPublic', true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  isPublicVal 
                    ? 'bg-brand-primary text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> Public
              </button>
              <button
                type="button"
                onClick={() => setValue('isPublic', false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  !isPublicVal 
                    ? 'bg-brand-primary text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="h-3.5 w-3.5" /> Private
              </button>
            </div>
          </div>

          {!isPublicVal && (
            <div className="grid md:grid-cols-2 gap-6 animate-fadeIn">
              <div className="bg-slate-950/40 p-5 rounded-lg border border-white/5 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Restricted Email Domains</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newDomain} 
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. student.edu, corporate.com" 
                    className="glass-input h-10 px-3 rounded-lg text-xs flex-1" 
                  />
                  <button type="button" onClick={handleAddDomain} className="px-4 bg-brand-secondary hover:bg-brand-secondary/95 text-white font-bold text-xs rounded-lg">
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {eligibilityDomains.length === 0 && <span className="text-xs text-slate-500 font-light">No domain restrictions added.</span>}
                  {eligibilityDomains.map((dom) => (
                    <span key={dom} className="inline-flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded text-xs text-white border border-white/5">
                      <span>@{dom}</span>
                      <button type="button" onClick={() => handleRemoveDomain(dom)} className="text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/40 p-5 rounded-lg border border-white/5 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Allowed Specific Emails</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. specialvoter@domain.com" 
                    className="glass-input h-10 px-3 rounded-lg text-xs flex-1" 
                  />
                  <button type="button" onClick={handleAddEmail} className="px-4 bg-brand-secondary hover:bg-brand-secondary/95 text-white font-bold text-xs rounded-lg">
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {eligibilityEmails.length === 0 && <span className="text-xs text-slate-500 font-light">No specific email limitations added.</span>}
                  {eligibilityEmails.map((em) => (
                    <span key={em} className="inline-flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded text-xs text-white border border-white/5">
                      <span className="truncate max-w-[150px]">{em}</span>
                      <button type="button" onClick={() => handleRemoveEmail(em)} className="text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              <span>Creating Draft ballot configurations...</span>
            </>
          ) : (
            <span>Save & Set Up Candidates</span>
          )}
        </button>
      </form>
    </div>
  );
}
