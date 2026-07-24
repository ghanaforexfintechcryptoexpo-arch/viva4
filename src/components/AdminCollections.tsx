import React, { useState } from "react";
import { 
  FolderHeart, Plus, Trash2, Edit2, Save, X, Check, CheckSquare, 
  Square, Info, Grid, Star
} from "lucide-react";
import { Product } from "../types";

export interface CollectionType {
  id: string;
  name: string;
  description: string;
  isFeatured: boolean;
  productIds: string[];
}

interface AdminCollectionsProps {
  products: Product[];
  collections: CollectionType[];
  onSaveCollection: (collection: CollectionType) => Promise<void>;
  onDeleteCollection: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function AdminCollections({
  products,
  collections,
  onSaveCollection,
  onDeleteCollection,
  isSubmitting = false
}: AdminCollectionsProps) {
  const [selectedCollection, setSelectedCollection] = useState<CollectionType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formProductIds, setFormProductIds] = useState<string[]>([]);
  
  const handleStartEdit = (col: CollectionType) => {
    setSelectedCollection(col);
    setIsEditing(true);
    setFormId(col.id);
    setFormName(col.name);
    setFormDesc(col.description);
    setFormIsFeatured(col.isFeatured);
    setFormProductIds(col.productIds || []);
  };

  const handleStartCreate = () => {
    setSelectedCollection(null);
    setIsEditing(true);
    setFormId("");
    setFormName("");
    setFormDesc("");
    setFormIsFeatured(false);
    setFormProductIds([]);
  };

  const handleToggleProduct = (prodId: string) => {
    if (formProductIds.includes(prodId)) {
      setFormProductIds(formProductIds.filter(id => id !== prodId));
    } else {
      setFormProductIds([...formProductIds, prodId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const id = formId.trim() || formName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    const updatedCollection: CollectionType = {
      id,
      name: formName.trim(),
      description: formDesc.trim(),
      isFeatured: formIsFeatured,
      productIds: formProductIds
    };

    await onSaveCollection(updatedCollection);
    setIsEditing(false);
    setSelectedCollection(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. COLLECTIONS VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE COLLECTIONS LIST */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                <FolderHeart className="w-4 h-4 text-pink-500" /> Active Collections
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {collections.length} Collections Planner Groups
              </span>
            </div>
            
            <button
              onClick={handleStartCreate}
              className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title="Formulate New Collection"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* List display */}
          {collections.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl">
              <FolderHeart className="w-10 h-10 mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-mono">No custom collections defined.</p>
              <p className="text-[10px] text-slate-400 mt-1">Use the "+" button to design one.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {collections.map(col => {
                const isSelected = selectedCollection?.id === col.id && isEditing;
                return (
                  <div 
                    key={col.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected 
                        ? "bg-pink-50/40 border-pink-300" 
                        : "bg-slate-50/20 hover:bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">
                            #{col.id}
                          </span>
                          {col.isFeatured && (
                            <span className="bg-pink-100 text-pink-800 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-pink-600 stroke-pink-600" /> Home Featured
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-1">{col.name}</h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{col.description}</p>
                        <p className="text-[10px] font-mono font-bold text-slate-400 mt-2 bg-slate-100 px-2 py-0.5 rounded-lg inline-block">
                          {col.productIds?.length || 0} Botanical Products Assigned
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(col)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
                          title="Modify Collection Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete collection "${col.name}"? products won't be deleted.`)) {
                              onDeleteCollection(col.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Decommission Collection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DETAIL EDIT FORM */}
        <div className="lg:col-span-7">
          {!isEditing ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-4 shadow-2xs">
              <Grid className="w-12 h-12 text-slate-200 mx-auto" />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase font-mono tracking-wider">Collections Workspace Ready</h2>
              <p className="text-slate-500 text-xs max-w-sm mx-auto leading-normal">
                Click a collection's edit icon to change its name, description, homepage featured showcase, or assign formulations. Or click the "+" button to inject a new category collection.
              </p>
              <button
                onClick={handleStartCreate}
                className="bg-slate-950 hover:bg-slate-900 text-white font-mono font-bold text-[10px] uppercase tracking-wider py-3 px-6 rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Create New Collection
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs">
              
              {/* Form Header */}
              <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-slate-800">
                <div>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-pink-400 uppercase">
                    {selectedCollection ? "Updating Collection details" : "Cataloging Collection group"}
                  </span>
                  <h2 className="text-base font-bold text-slate-100">
                    {selectedCollection ? `Update: ${formName || "Collection Group"}` : "Create Collection Group"}
                  </h2>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedCollection(null);
                  }}
                  className="p-1 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto text-xs text-slate-800">
                
                {/* ID & NAME */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Collection ID Code
                    </label>
                    <input
                      type="text"
                      disabled={selectedCollection !== null}
                      placeholder="e.g. best-sellers"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="w-full bg-slate-50 text-slate-900 font-mono text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-pink-500 disabled:opacity-60"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Alpha-numeric, hyphens only. Generated automatically if blank.</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daily Support Vitality"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-pink-500 font-bold"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Collection Description / Copy
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief introductory copy displayed for this product collection..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-pink-500 leading-relaxed"
                  />
                </div>

                {/* FEATURED SWITCH */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-pink-500 fill-pink-500/10" /> Homepage Showcase Group
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Toggle to feature this collection in the prominent homepage category slides.</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setFormIsFeatured(!formIsFeatured)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formIsFeatured ? "bg-pink-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formIsFeatured ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* PRODUCT MATRIX ASSIGNMENTS */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800">Assign Botanical Formulations</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Check any products you want to assign to this collection list:</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {products.map(p => {
                      const isChecked = formProductIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleToggleProduct(p.id)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                            isChecked 
                              ? "bg-pink-50/20 border-pink-200 hover:bg-pink-50/30" 
                              : "bg-slate-50/30 hover:bg-slate-50 border-slate-150"
                          }`}
                        >
                          <span className={`p-0.5 rounded transition-colors ${isChecked ? "text-pink-600" : "text-slate-300"}`}>
                            {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-800 text-xs truncate">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono truncate uppercase">Goal: {p.goal}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Form Actions Footer Panel */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedCollection(null);
                  }}
                  className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 text-white py-3 rounded-xl font-extrabold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/10 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-pink-400" />
                  {isSubmitting ? "Saving..." : "Save Collection"}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>

    </div>
  );
}
