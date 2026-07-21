import React, { useState, useEffect } from "react";
import { generateSrcSet } from "../utils";
import { 
  googleWorkspaceSignIn, 
  getWorkspaceAccessToken, 
  setWorkspaceAccessToken, 
  workspaceLogout 
} from "../lib/workspaceAuth";
import { 
  FileText, 
  FolderOpen, 
  PlusCircle, 
  ExternalLink, 
  LogOut, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  FileSpreadsheet, 
  Presentation, 
  ArrowRight,
  Shield,
  Activity,
  User,
  RefreshCw,
  Info
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { auth } from "../lib/firebase";

interface SlideInfo {
  objectId: string;
  elementsCount: number;
  title?: string;
}

interface PresentationMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

export default function SlidesWorkspace() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"wizard" | "list">("wizard");
  
  // Presentation List State
  const [presentations, setPresentations] = useState<PresentationMetadata[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Selected Presentation Detail
  const [selectedPresId, setSelectedPresId] = useState<string | null>(null);
  const [selectedPresDetails, setSelectedPresDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Wizard Input State
  const [clientName, setClientName] = useState("");
  const [healthFocus, setHealthFocus] = useState("prostate");
  const [practitionerName, setPractitionerName] = useState("Lead Clinician");
  const [durationWeeks, setDurationWeeks] = useState("12");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Generation process state
  const [generationSteps, setGenerationSteps] = useState<{ label: string; status: "idle" | "loading" | "success" | "error" }[]>([
    { label: "Authenticate Google Workspace session", status: "idle" },
    { label: "Create empty Google Slides template", status: "idle" },
    { label: "Build Cover Title Slide with custom branding", status: "idle" },
    { label: "Formulate Clinical Biology slide based on profile", status: "idle" },
    { label: "Structure Compliance and TMPC Registration details", status: "idle" },
    { label: "Save to Google Drive & finalize metadata", status: "idle" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPresUrl, setGeneratedPresUrl] = useState<string | null>(null);
  const [generatedPresId, setGeneratedPresId] = useState<string | null>(null);

  // Sync state with in-memory token on mount
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      const token = getWorkspaceAccessToken();
      setAccessToken(token);
      setIsLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoadingAuth(true);
      const result = await googleWorkspaceSignIn();
      if (result) {
        setAccessToken(result.accessToken);
        setCurrentUser(result.user);
        // Automatically load existing presentations
        fetchPresentations(result.accessToken);
      }
    } catch (err) {
      console.error("Workspace Login failed: ", err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await workspaceLogout();
    setAccessToken(null);
    setCurrentUser(null);
    setPresentations([]);
    setSelectedPresId(null);
    setSelectedPresDetails(null);
  };

  const fetchPresentations = async (token: string) => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.presentation'&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) {
        throw new Error(`Google API responded with status ${res.status}`);
      }
      const data = await res.json();
      setPresentations(data.files || []);
    } catch (err: any) {
      console.error("Error fetching presentations: ", err);
      setListError("Could not retrieve presentation lists. Please check your credentials.");
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadPresentationDetails = async (id: string) => {
    if (!accessToken) return;
    setIsLoadingDetails(true);
    setSelectedPresId(id);
    try {
      const res = await fetch(`https://slides.googleapis.com/v1/presentations/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const details = await res.json();
        setSelectedPresDetails(details);
      }
    } catch (err) {
      console.error("Error loading slides details: ", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const runSlideGeneration = async () => {
    if (!accessToken) {
      alert("Please connect your Google Workspace account first.");
      return;
    }

    const nameToUse = clientName.trim() || currentUser?.displayName || "Valued Patron";

    setIsGenerating(true);
    setGeneratedPresUrl(null);
    setGeneratedPresId(null);

    // Initialize steps
    const steps = [...generationSteps];
    steps.forEach(s => s.status = "idle");
    setGenerationSteps(steps);

    const updateStepStatus = (index: number, status: "loading" | "success" | "error") => {
      setGenerationSteps(prev => {
        const next = [...prev];
        next[index].status = status;
        return next;
      });
    };

    try {
      // Step 0: Auth Session verification
      updateStepStatus(0, "loading");
      await new Promise(r => setTimeout(r, 600));
      updateStepStatus(0, "success");

      // Step 1: Create Presentation
      updateStepStatus(1, "loading");
      const title = `ProViva Wellness Program - ${nameToUse}`;
      const createRes = await fetch("https://slides.googleapis.com/v1/presentations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title })
      });
      if (!createRes.ok) {
        throw new Error("Failed to create presentation template in Google Drive");
      }
      const newPresentation = await createRes.json();
      const presentationId = newPresentation.presentationId;
      updateStepStatus(1, "success");

      // Step 2: Build Cover Title Slide
      updateStepStatus(2, "loading");
      await new Promise(r => setTimeout(r, 700));

      // Get first slide's ID (it is automatically created inside the new presentation)
      const firstSlideId = newPresentation.slides?.[0]?.objectId || "p";

      // Prepare batch updates
      const batchRequests: any[] = [];

      // Create a background shape for Slide 1 (Dark Emerald Green/Slate theme)
      // Standard presentation dimensions are 10 x 5.625 inches. 1 inch = 914,400 EMUs.
      // Width = 9,144,000 EMUs, Height = 5,142,500 EMUs
      batchRequests.push(
        {
          createShape: {
            objectId: "bg_slide_1",
            shapeType: "RECTANGLE",
            elementProperties: {
              pageId: firstSlideId,
              size: {
                height: { magnitude: 5142500, unit: "EMU" },
                width: { magnitude: 9144000, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: 0,
                unit: "EMU"
              }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: "bg_slide_1",
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: {
                  color: { rgbColor: { red: 0.05, green: 0.07, blue: 0.11 } } // Dark slate background
                }
              },
              outline: {
                outlineFill: {
                  solidFill: {
                    color: { rgbColor: { red: 0.05, green: 0.07, blue: 0.11 } }
                  }
                }
              }
            },
            fields: "shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color"
          }
        },
        // Main Title Box
        {
          createShape: {
            objectId: "title_box_1",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: firstSlideId,
              size: {
                height: { magnitude: 1800000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400, // 1 inch padding left
                translateY: 1097280, // 1.2 inches top
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "title_box_1",
            insertionIndex: 0,
            text: "ProViva Wellness Program"
          }
        },
        {
          updateTextStyle: {
            objectId: "title_box_1",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Space Grotesk",
              fontSize: { magnitude: 36, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.8, blue: 0.5 } } }, // Emerald green title
              bold: true
            },
            fields: "fontFamily,fontSize,foregroundColor,bold"
          }
        },
        // Subtitle Box
        {
          createShape: {
            objectId: "subtitle_box_1",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: firstSlideId,
              size: {
                height: { magnitude: 1500000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400,
                translateY: 2834640, // 3.1 inches top
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "subtitle_box_1",
            insertionIndex: 0,
            text: `Personalized Vitality & Longevity Protocol for ${nameToUse}\nPrepared by: ${practitionerName}\nTherapy Cycle: ${durationWeeks} Weeks Plan\nGenerated via ProViva Labs Secure Node`
          }
        },
        {
          updateTextStyle: {
            objectId: "subtitle_box_1",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Inter",
              fontSize: { magnitude: 14, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.8, green: 0.83, blue: 0.88 } } },
              lineSpacing: 150
            },
            fields: "fontFamily,fontSize,foregroundColor,lineSpacing"
          }
        }
      );

      updateStepStatus(2, "success");

      // Step 3: Formulate Clinical Biology slide
      updateStepStatus(3, "loading");
      await new Promise(r => setTimeout(r, 800));

      const slide2Id = "slide_2_clinical";

      // Formulate custom content based on health focus
      let recommendationTitle = "";
      let activeCompounds = "";
      let protocolSchedule = "";

      if (healthFocus === "prostate") {
        recommendationTitle = "Prostate & Urinary Tract Viability Protocol";
        activeCompounds = "Bio-Active Saw Palmetto, Pygeum Bark extract, pumpkin seeds & beta-sitosterol.";
        protocolSchedule = "Cycle: 2 capsules daily (1 with breakfast, 1 with evening meal).\nAction: Target urinary flow dynamics, maintain bladder cellular safety, and promote anti-inflammatory prostate tissue homeostasis.";
      } else if (healthFocus === "liver") {
        recommendationTitle = "HepaViva Active Liver Detoxification Protocol";
        activeCompounds = "Premium Milk Thistle Silymarin extract (standardized to 80%), Artichoke extract, and N-Acetyl Cysteine (NAC).";
        protocolSchedule = "Cycle: 2 tablets daily with clean spring water.\nAction: Support biological glutathione synthesis, cellular liver enzyme regulation, and safe lipid metabolic clearance.";
      } else if (healthFocus === "heart") {
        recommendationTitle = "VivaDio Advanced Cardiovascular Health Program";
        activeCompounds = "High-Fidelity Coenzyme Q10 (CoQ10), Hawthorne Berry, standardized aged garlic extract, and resveratrol.";
        protocolSchedule = "Cycle: 1 capsule in the morning, 1 capsule with lunch.\nAction: Enhance arterial compliance, vascular integrity, myocardial cellular ATP energy, and maintain healthy blood pressure levels.";
      } else {
        recommendationTitle = "Integrated Botanical Vitality & Restoration Plan";
        activeCompounds = "Adaptogenic Astragalus Root, Panax Ginseng, Ginger Root, and organic multi-botanicals.";
        protocolSchedule = "Cycle: 2 daily servings taken consistently for 12 weeks.\nAction: Balance biological stress response pathways, support digestive gut flora absorption, and bolster natural cellular energy cascades.";
      }

      batchRequests.push(
        // Create second slide
        {
          createSlide: {
            objectId: slide2Id,
            insertionIndex: 1,
            slideLayoutReference: { predefinedLayout: "BLANK" }
          }
        },
        // Background
        {
          createShape: {
            objectId: "bg_slide_2",
            shapeType: "RECTANGLE",
            elementProperties: {
              pageId: slide2Id,
              size: {
                height: { magnitude: 5142500, unit: "EMU" },
                width: { magnitude: 9144000, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: 0,
                unit: "EMU"
              }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: "bg_slide_2",
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: {
                  color: { rgbColor: { red: 0.98, green: 0.98, blue: 0.98 } } // Soft white background
                }
              },
              outline: {
                outlineFill: {
                  solidFill: {
                    color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } }
                  }
                }
              }
            },
            fields: "shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color"
          }
        },
        // Header line
        {
          createShape: {
            objectId: "header_box_2",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: slide2Id,
              size: {
                height: { magnitude: 600000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400,
                translateY: 457200, // 0.5 inches top
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "header_box_2",
            insertionIndex: 0,
            text: "Section 01: Botanical Therapeutic Recommendations"
          }
        },
        {
          updateTextStyle: {
            objectId: "header_box_2",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Space Grotesk",
              fontSize: { magnitude: 11, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.4, green: 0.45, blue: 0.55 } } },
              bold: true
            },
            fields: "fontFamily,fontSize,foregroundColor,bold"
          }
        },
        // Slide Title
        {
          createShape: {
            objectId: "title_box_2",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: slide2Id,
              size: {
                height: { magnitude: 800000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400,
                translateY: 914400, // 1 inch top
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "title_box_2",
            insertionIndex: 0,
            text: recommendationTitle
          }
        },
        {
          updateTextStyle: {
            objectId: "title_box_2",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Space Grotesk",
              fontSize: { magnitude: 22, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.05, green: 0.08, blue: 0.15 } } },
              bold: true
            },
            fields: "fontFamily,fontSize,foregroundColor,bold"
          }
        },
        // Body Box
        {
          createShape: {
            objectId: "body_box_2",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: slide2Id,
              size: {
                height: { magnitude: 2800000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400,
                translateY: 1828800, // 2 inches top
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "body_box_2",
            insertionIndex: 0,
            text: `Clinical Botanical Compound Focus:\n${activeCompounds}\n\nPrescribed Daily Administration Regimen:\n${protocolSchedule}\n\nNotes from Lab Practitioner:\n${additionalNotes || "Follow regular hydration and dietary advice consistently. Take each dose alongside standard healthy meals for optimum fat-soluble cellular bioavailability."}`
          }
        },
        {
          updateTextStyle: {
            objectId: "body_box_2",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Inter",
              fontSize: { magnitude: 11, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.25, blue: 0.35 } } },
              lineSpacing: 140
            },
            fields: "fontFamily,fontSize,foregroundColor,lineSpacing"
          }
        }
      );

      updateStepStatus(3, "success");

      // Step 4: Structure Compliance and TMPC Registration details
      updateStepStatus(4, "loading");
      await new Promise(r => setTimeout(r, 800));

      const slide3Id = "slide_3_compliance";
      batchRequests.push(
        // Create third slide
        {
          createSlide: {
            objectId: slide3Id,
            insertionIndex: 2,
            slideLayoutReference: { predefinedLayout: "BLANK" }
          }
        },
        // Background shape for Slide 3 (Clean light white with border)
        {
          createShape: {
            objectId: "bg_slide_3",
            shapeType: "RECTANGLE",
            elementProperties: {
              pageId: slide3Id,
              size: {
                height: { magnitude: 5142500, unit: "EMU" },
                width: { magnitude: 9144000, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: 0,
                unit: "EMU"
              }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: "bg_slide_3",
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: {
                  color: { rgbColor: { red: 0.98, green: 0.99, blue: 0.98 } }
                }
              },
              outline: {
                outlineFill: {
                  solidFill: {
                    color: { rgbColor: { red: 0.2, green: 0.7, blue: 0.4 } } // Green border
                  }
                },
                weight: { magnitude: 100000, unit: "EMU" }
              }
            },
            fields: "shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color,outline.weight"
          }
        },
        // Header line
        {
          createShape: {
            objectId: "header_box_3",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: slide3Id,
              size: {
                height: { magnitude: 600000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400,
                translateY: 457200,
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "header_box_3",
            insertionIndex: 0,
            text: "Section 02: Biological Safety, Standards & Local Regulations"
          }
        },
        {
          updateTextStyle: {
            objectId: "header_box_3",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Space Grotesk",
              fontSize: { magnitude: 11, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.4, green: 0.45, blue: 0.55 } } },
              bold: true
            },
            fields: "fontFamily,fontSize,foregroundColor,bold"
          }
        },
        // Slide Title
        {
          createShape: {
            objectId: "title_box_3",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: slide3Id,
              size: {
                height: { magnitude: 800000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400,
                translateY: 914400,
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "title_box_3",
            insertionIndex: 0,
            text: "Ghana TMPC Safety Certification & Regulatory Standards"
          }
        },
        {
          updateTextStyle: {
            objectId: "title_box_3",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Space Grotesk",
              fontSize: { magnitude: 22, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.05, green: 0.08, blue: 0.15 } } },
              bold: true
            },
            fields: "fontFamily,fontSize,foregroundColor,bold"
          }
        },
        // Body text
        {
          createShape: {
            objectId: "body_box_3",
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageId: slide3Id,
              size: {
                height: { magnitude: 2800000, unit: "EMU" },
                width: { magnitude: 7315200, unit: "EMU" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 914400,
                translateY: 1828800,
                unit: "EMU"
              }
            }
          }
        },
        {
          insertText: {
            objectId: "body_box_3",
            insertionIndex: 0,
            text: "All of our formulation batches undergo rigorous chemical audit procedures to guarantee therapeutic biological purity and high bioavailability indices:\n\n• Certified 100% Organic, non-GMO, gluten-free compounds.\n• Handcrafted in state-of-the-art GMP-compliant laboratory systems.\n• Clinically registered and certified under the Ghana Traditional Medicine Practice Council (TMPC).\n• Audited closely by clinical pharmacologists for continuous product excellence."
          }
        },
        {
          updateTextStyle: {
            objectId: "body_box_3",
            textRange: { type: "ALL" },
            style: {
              fontFamily: "Inter",
              fontSize: { magnitude: 11, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.25, blue: 0.35 } } },
              lineSpacing: 150
            },
            fields: "fontFamily,fontSize,foregroundColor,lineSpacing"
          }
        }
      );

      updateStepStatus(4, "success");

      // Step 5: Execute batch update and save to Google Drive
      updateStepStatus(5, "loading");
      const batchRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests: batchRequests })
      });

      if (!batchRes.ok) {
        throw new Error("Failed to populate slide contents. Please retry.");
      }

      updateStepStatus(5, "success");

      setGeneratedPresId(presentationId);
      setGeneratedPresUrl(`https://docs.google.com/presentation/d/${presentationId}/edit`);
      
      // Trigger list refresh
      fetchPresentations(accessToken);

    } catch (err: any) {
      console.error("Error during slides generation: ", err);
      // Set current step to error
      setGenerationSteps(prev => {
        const next = [...prev];
        const loadingIdx = next.findIndex(s => s.status === "loading");
        if (loadingIdx !== -1) {
          next[loadingIdx].status = "error";
        }
        return next;
      });
      alert(err.message || "An unexpected error occurred during Google Slides rendering.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      {/* Intro Header banner */}
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Presentation className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">ProViva Presentation Node</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clinical Slide Workspace</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Generate customized health protocol presentation decks and clinical programs stored securely in your Google Slides cloud storage.
          </p>
        </div>

        <div>
          {accessToken ? (
            <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="User" 
                  className="w-8 h-8 rounded-full border border-emerald-500/30" 
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  {...generateSrcSet(currentUser.photoURL)}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">
                  {currentUser?.displayName?.[0] || "U"}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-bold leading-none text-slate-100">{currentUser?.displayName || "Google User"}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{currentUser?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                title="Disconnect Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-md font-semibold text-xs px-4 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer hover:scale-102"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              Connect Google Workspace
            </button>
          )}
        </div>
      </div>

      {accessToken ? (
        <>
          {/* TAB BAR */}
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            <button
              onClick={() => setActiveTab("wizard")}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "wizard" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Custom Deck Wizard
            </button>
            <button
              onClick={() => {
                setActiveTab("list");
                fetchPresentations(accessToken);
              }}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "list" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              My Drive Presentations
            </button>
          </div>

          {/* TAB CONTENT: WIZARD */}
          {activeTab === "wizard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Input fields */}
              <div className="lg:col-span-5 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Protocol Parameters
                </h3>

                <div className="space-y-4">
                  {/* Client Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Client Full Name
                    </label>
                    <input
                      type="text"
                      placeholder={currentUser?.displayName || "John Doe"}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 text-slate-800"
                    />
                  </div>

                  {/* Primary Focus */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Biological Health Focus
                    </label>
                    <select
                      value={healthFocus}
                      onChange={(e) => setHealthFocus(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 text-slate-800"
                    >
                      <option value="prostate">Prostate & Urinary Care (ProViva)</option>
                      <option value="liver">Liver Rejuvenation & Detox (HepaViva)</option>
                      <option value="heart">Cardiovascular Vitality (VivaDio)</option>
                      <option value="general">Comprehensive Restorative Support</option>
                    </select>
                  </div>

                  {/* Practitioner Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Lead Lab Scientist
                    </label>
                    <input
                      type="text"
                      value={practitionerName}
                      onChange={(e) => setPractitionerName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 text-slate-800"
                    />
                  </div>

                  {/* Duration Cycle */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Therapeutic Protocol Cycle
                    </label>
                    <select
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 text-slate-800"
                    >
                      <option value="4">4 Weeks Program</option>
                      <option value="8">8 Weeks Program</option>
                      <option value="12">12 Weeks Standard Cycle</option>
                      <option value="24">24 Weeks Complete Restoration</option>
                    </select>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Custom Clinical Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add custom hydration guidelines, allergen warnings, physical activity cycles..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  onClick={runSlideGeneration}
                  disabled={isGenerating}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Presentation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                      Generate Personalized Presentation
                    </>
                  )}
                </button>
              </div>

              {/* Status & Preview Output */}
              <div className="lg:col-span-7 space-y-6">
                {isGenerating && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs">
                    <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                      Designing Clinical Slide Program
                    </h4>
                    <div className="space-y-3">
                      {generationSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {step.status === "idle" && (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                          )}
                          {step.status === "loading" && (
                            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                          )}
                          {step.status === "success" && (
                            <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/10 shrink-0" />
                          )}
                          {step.status === "error" && (
                            <div className="w-4 h-4 bg-rose-500 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                          )}
                          <span className={`text-xs ${
                            step.status === "success" ? "text-slate-500 font-medium" : 
                            step.status === "loading" ? "text-emerald-700 font-semibold" : "text-slate-400"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedPresUrl && generatedPresId && (
                  <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">Success</span>
                          <h4 className="text-sm font-extrabold text-slate-900">Custom Presentation Ready</h4>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">
                          Slide deck saved automatically to Google Drive folder.
                        </p>
                      </div>

                      <a
                        href={generatedPresUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10"
                      >
                        Open In Google Slides
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Slide preview frame */}
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 shadow-lg">
                      <iframe
                        src={`https://docs.google.com/presentation/d/${generatedPresId}/embed?start=false&loop=false&delayms=3000`}
                        width="100%"
                        height="100%"
                        allowFullScreen={true}
                        title="Google Slides Preview"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {!isGenerating && !generatedPresUrl && (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <Presentation className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-sm font-extrabold text-slate-900">No Custom Slide Deck Generated Yet</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Specify client goals on the left panel and hit "Generate" to build a personalized traditional medicine compound wellness slide presentation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: PRESENTATION LIST */}
          {activeTab === "list" && (
            <div className="space-y-6">
              {isLoadingList ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs text-slate-500 font-mono">Querying files from Google Drive...</span>
                </div>
              ) : listError ? (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center space-y-2">
                  <p className="text-xs text-rose-800 font-semibold">{listError}</p>
                  <button 
                    onClick={() => fetchPresentations(accessToken)}
                    className="text-xs text-rose-600 underline font-semibold flex items-center gap-1 mx-auto hover:text-rose-800 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Connection
                  </button>
                </div>
              ) : presentations.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                  <p className="text-xs text-slate-500">No Google Slides presentations found in your Google Drive.</p>
                  <button
                    onClick={() => setActiveTab("wizard")}
                    className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-800 cursor-pointer"
                  >
                    Create Custom Deck
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Presentation list panel */}
                  <div className="lg:col-span-5 bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        Google Drive Slide Decks ({presentations.length})
                      </h3>
                      <button 
                        onClick={() => fetchPresentations(accessToken)}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                        title="Reload presentation list"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
                      {presentations.map((pres) => {
                        const isSelected = pres.id === selectedPresId;
                        return (
                          <div
                            key={pres.id}
                            onClick={() => loadPresentationDetails(pres.id)}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                              isSelected 
                                ? "bg-emerald-50/70 border-emerald-200 shadow-xs" 
                                : "bg-slate-50/50 hover:bg-slate-50 border-slate-150/80"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                                <Presentation className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">{pres.name}</h4>
                                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                                  Modified: {new Date(pres.modifiedTime).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Presentation detail viewer */}
                  <div className="lg:col-span-7">
                    {selectedPresId ? (
                      <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
                        {isLoadingDetails ? (
                          <div className="py-24 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            <span className="text-xs text-slate-500">Parsing slide metadata...</span>
                          </div>
                        ) : selectedPresDetails ? (
                          <div className="space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900 leading-none">
                                  {selectedPresDetails.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                  ID: {selectedPresDetails.presentationId}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={`https://docs.google.com/presentation/d/${selectedPresDetails.presentationId}/edit`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                                >
                                  Open Slide Editor
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            {/* Embed frame */}
                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 shadow-md">
                              <iframe
                                src={`https://docs.google.com/presentation/d/${selectedPresDetails.presentationId}/embed?start=false&loop=false&delayms=3000`}
                                width="100%"
                                height="100%"
                                allowFullScreen={true}
                                title="Google Slides Preview"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Slides parsing statistics / details */}
                            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                              <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-slate-400" />
                                Presentation Structural Metadata
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Total Slides</span>
                                  <span className="text-sm font-bold text-slate-900">{selectedPresDetails.slides?.length || 0} Slides</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">MimeType</span>
                                  <span className="text-[10px] font-mono font-medium text-slate-700">Google Slides Application</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-24 text-center text-xs text-rose-500">Failed to load details.</div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl">
                          <Presentation className="w-8 h-8" />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900">Select Presentation to Preview</h4>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Select any of your cloud presentations from the left panel list to view, embed, or navigate its slides inside your browser.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* CONNECT ADVERTISEMENT CARD */
        <div className="bg-white border border-slate-150 rounded-3xl shadow-lg p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
            <Presentation className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Access ProViva Presentation Node</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xl mx-auto">
              Elevate your clinical customer compliance! Connect Google Workspace to build high-fidelity personalized client wellness slides, access regulatory safety templates, and share beautiful health protocols instantly.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-150/70 p-4 rounded-2xl max-w-lg mx-auto text-left space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> Secure Sandbox Compliance
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Requires Google drive and presentation read/write permissions.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>All documents are securely saved to your private Google Drive.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Authentication is fully secured and processed via Firebase.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleLogin}
            className="inline-flex bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-98 gap-3 items-center"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Connect With Google Workspace
          </button>
        </div>
      )}
    </div>
  );
}
