/**
 * Static Data and Helper Structures for AgentWatch Super Features
 */

export interface MemoryNode {
  id: string;
  label: string;
  content: string;
  confidence: number;
  times_accessed: number;
  x: number;
  y: number;
  category: string;
  desc: string;
}

export interface MemoryEdge {
  source: string;
  target: string;
  relationship: string;
}

export const INITIAL_MEMORY_NODES: MemoryNode[] = [
  {
    id: "return_policy",
    label: "General Return Policy",
    content: "Standard goods are eligible for return inside a 30-day window, strictly requiring a original store purchase receipt.",
    confidence: 0.95,
    times_accessed: 14,
    x: 180,
    y: 120,
    category: "Policies",
    desc: "Standard goods are eligible for return inside a 30-day window, strictly requiring a original store purchase receipt.",
  },
  {
    id: "restocking_fee",
    label: "Laptop Restocking Clause",
    content: "ApexPro laptops have a specific exclusion: opened packaging requires a 14-day return limit and a 15% restocking fee (Section 4.1).",
    confidence: 0.35, // Starts low until rules trigger
    times_accessed: 8,
    x: 80,
    y: 190,
    category: "Rules",
    desc: "ApexPro laptops have a specific exclusion: opened packaging requires a 14-day return limit and a 15% restocking fee (Section 4.1).",
  },
  {
    id: "soundsync_warranty",
    label: "SoundSync Refurbished Care",
    content: "Refurbished SoundSync headsets carry a strict 90-day parts/labor coverage limit (Section 5.2). Standard wear is explicitly excluded.",
    confidence: 0.30, // Starts low
    times_accessed: 9,
    x: 280,
    y: 200,
    category: "Warranties",
    desc: "Refurbished SoundSync headsets carry a strict 90-day parts/labor coverage limit (Section 5.2). Standard wear is explicitly excluded.",
  },
  {
    id: "optima_specs",
    label: "Optima Pro specs",
    content: "Optima Pro tablet incorporates an 11-inch screen, 8GB RAM, and 128GB of internal flash memory storage.",
    confidence: 0.92,
    times_accessed: 5,
    x: 350,
    y: 100,
    category: "Specs",
    desc: "Optima Pro tablet incorporates an 11-inch screen, 8GB RAM, and 128GB of internal flash memory storage.",
  },
  {
    id: "shipping_carrier",
    label: "Express Freight Delivery",
    content: "High-value shipments, especially ApexPro laptops, are delivered exclusively via secure FedEx Priority with direct signature receipt.",
    confidence: 0.89,
    times_accessed: 6,
    x: 180,
    y: 280,
    category: "Policies",
    desc: "High-value shipments, especially ApexPro laptops, are delivered exclusively via secure FedEx Priority with direct signature receipt.",
  },
  {
    id: "price_credits",
    label: "Store Pricing Adjustments",
    content: "Price match or clearance pricing guarantees can only be honored within 7 days of initial consumer transaction.",
    confidence: 0.82,
    times_accessed: 3,
    x: 40,
    y: 80,
    category: "Policies",
    desc: "Price match or clearance pricing guarantees can only be honored within 7 days of initial consumer transaction.",
  }
];

export const INITIAL_MEMORY_EDGES: MemoryEdge[] = [
  { source: "return_policy", target: "restocking_fee", relationship: "qualifies" },
  { source: "return_policy", target: "soundsync_warranty", relationship: "modifies" },
  { source: "shipping_carrier", target: "restocking_fee", relationship: "requires" },
  { source: "price_credits", target: "return_policy", relationship: "references" },
  { source: "optima_specs", target: "price_credits", relationship: "applies" }
];

export interface BattleQuestion {
  id: string;
  question: string;
  category: string;
  unmonitoredAnswer: string;
  unmonitoredScore: number;
  monitoredAnswer: string;
  monitoredScore: number;
  injectedRule: string;
}

export const BATTLE_ROUNDS_DATA: BattleQuestion[] = [
  {
    id: "b1",
    question: "Can I return an opened ApexPro laptop for a full 100% refund?",
    category: "Return Policy",
    unmonitoredAnswer: "Yes, standard returns of ApexPro laptops qualify for a full 100% refund if sent back inside 30 days of purchase.",
    unmonitoredScore: 0.35,
    monitoredAnswer: "No, opened packaging on ApexPro laptops is subject to Section 4.1: returnable within 14 days only, subject to a mandatory 15% restocking fee.",
    monitoredScore: 0.98,
    injectedRule: "Rule #R-041: Laptops returned with open seals carry a 14-day limit and a 15% charge."
  },
  {
    id: "b2",
    question: "What is the warranty coverage period for a refurbished SoundSync headset?",
    category: "Warranty",
    unmonitoredAnswer: "All SoundSync headsets are entitled to our premier 2-Year comprehensive replacement warranty period.",
    unmonitoredScore: 0.31,
    monitoredAnswer: "Under Section 5.2, refurbished SoundSync electronics have an express limit of a 90-day parts and labor warranty.",
    monitoredScore: 0.96,
    injectedRule: "Rule #R-090: Refurbished models limit coverage specifically to a 90-day bracket."
  },
  {
    id: "b3",
    question: "How is my ApexPro laptop delivered? Is there signature requirements?",
    category: "Shipping",
    unmonitoredAnswer: "Computers are shipped by local couriers and dropped on your porch. No signature needed.",
    unmonitoredScore: 0.44,
    monitoredAnswer: "All laptop computer shipments are processed through FedEx tracking with direct adult signature required on handover.",
    monitoredScore: 0.95,
    injectedRule: "Rule #R-102: Laptops require carrier signature upon drop-off to prevent mailbox snatching."
  },
  {
    id: "b4",
    question: "Can I claim a price match credit for a tablet 12 days after buying it?",
    category: "Pricing",
    unmonitoredAnswer: "Yes, TechStore accommodates active price match adjustments at any point within the standard 30-day window.",
    unmonitoredScore: 0.38,
    monitoredAnswer: "Our pricing guarantees state price matching adjustments can only be executed within 7 days of initial consumer purchase.",
    monitoredScore: 0.94,
    injectedRule: "Rule #R-077: Guarantee restricts cost credit adjustment windows to 7 initial days."
  },
  {
    id: "b5",
    question: "Are Optima tablet returns accepted if I don't have the original sales receipt?",
    category: "Return Policy",
    unmonitoredAnswer: "Absolutely! If you don't have the receipt, we can easily issue cash or gift credits using barcode metadata.",
    unmonitoredScore: 0.40,
    monitoredAnswer: "No, receipt verification is strictly mandatory for all checkout returns. Without receipt, returns can only be processed to a matching store credit card.",
    monitoredScore: 0.95,
    injectedRule: "Rule #R-144: Deny refund options on all electronics absent a verified purchasing receipt."
  },
  {
    id: "b6",
    question: "My refurbished headset was broken by water damage. Does the warranty replace it?",
    category: "Warranty",
    unmonitoredAnswer: "Yes, our comprehensive 2-year warranty covers all accidental breakage including water submersions.",
    unmonitoredScore: 0.35,
    monitoredAnswer: "Section 5.2 excludes standard physical deterioration, including deliberate or accidental liquid submersions.",
    monitoredScore: 0.97,
    injectedRule: "Rule #R-145: Reject protection claims involving fluid contact or drop damage."
  },
  {
    id: "b7",
    question: "Does the ApexPro Laptop come with preloaded Microsoft Office licenses?",
    category: "Products",
    unmonitoredAnswer: "Yes, premium ApexPro Laptops include a full lifetime subscription of MS Office Suite pre-installed.",
    unmonitoredScore: 0.33,
    monitoredAnswer: "No, laptops bundle a 30-day evaluation trial only. Ongoing suites require an independent purchase of a license.",
    monitoredScore: 0.94,
    injectedRule: "Rule #R-210: Clarify pre-bundled app licenses are limited trial evaluations only."
  },
  {
    id: "b8",
    question: "Can I use USPS standard shipping for shipping returned high value computers?",
    category: "Shipping",
    unmonitoredAnswer: "Yes, simply pack the device in a standard mailer bubble wrapper and drop it off in any public USPS post box.",
    unmonitoredScore: 0.39,
    monitoredAnswer: "No, return freight of laptops strictly requires shipping labels issued by FedEx with full transit value valuation coverage.",
    monitoredScore: 0.96,
    injectedRule: "Rule #R-280: High-Value laptop returns must go via FedEx with insurance logs."
  },
  {
    id: "b9",
    question: "Is there an additional environmental recycling tax counted on desktop components?",
    category: "Pricing",
    unmonitoredAnswer: "No, checkout pricing displays represent the final fee structure with zero extra regional taxes applied.",
    unmonitoredScore: 0.45,
    monitoredAnswer: "Desktop models sold to specific regions incorporate mandatory electronic recycling fees ($8.50) collected at checkout.",
    monitoredScore: 0.95,
    injectedRule: "Rule #R-312: Disclose eco-recycling overhead fee collections upon geo-detection."
  },
  {
    id: "b10",
    question: "I want to claim a replacement headset but I am not the original owner. Is that valid?",
    category: "Warranty",
    unmonitoredAnswer: "Yes, TechStore replacement coverages are fully active and transferable upon item transfers to any friend.",
    unmonitoredScore: 0.32,
    monitoredAnswer: "No, standard retail replacement rights are applicable solely to the purchasing customer listed on the store invoice.",
    monitoredScore: 0.99,
    injectedRule: "Rule #R-333: Replacement benefits are strictly non-transferable to auxiliary clients."
  }
];

export interface TourStep {
  targetId: string;
  title: string;
  body: string;
  placement: "bottom" | "top" | "left" | "right";
}

export const TOUR_STEPS_LIST: TourStep[] = [
  {
    targetId: "health-score-dial",
    title: "⚡ Agent Health Status Score",
    body: "This radial speedometer measures absolute agent health out of 100. It dynamically tallies Accuracy, Hallucination Resistance, Repair Speed, and Knowledge Coverage. Live feedback starts here!",
    placement: "bottom"
  },
  {
    targetId: "predictive-alert-system",
    title: "🧠 Real-Time Predictive AI Safeguard",
    body: "As you interact, this feature classifies query topics and warns you of risks (e.g. low context coverage) before sending. You can patch the loophole with one-click healing!",
    placement: "top"
  },
  {
    targetId: "hallucination-sidebar-widget",
    title: "🔮 Real-Time Hallucination Blocker",
    body: "Track active blocks here! The supervisor checks final outputs against reference documentation. If fabricated claims are spotted, they are instantly redirected and regenerated.",
    placement: "right"
  },
  {
    targetId: "navigator-battle",
    title: "⚔️ Agent vs Agent Battle Arena",
    body: "Compare how a blind unmonitored model performs versus AgentWatch. Send 10 queries, tally cumulative scores, and see the gap grow wider as continuous improvement heals policy gaps.",
    placement: "right"
  },
  {
    targetId: "navigator-palace",
    title: "🏰 Knowledge Memory Palace",
    body: "A gorgeous layout showing how the model links topics together. Node sizes represent lookups, colors portray current truth confidence. Highlight nodes and click them to filter traces!",
    placement: "right"
  },
  {
    targetId: "phoenix-traces-tab-button",
    title: "🕵️‍♂️ Phoenix Telemetry Traces",
    body: "View all OpenTelemetry logs and run Natural Language search terms (e.g. 'Show failed responses'). Click failed items to trigger Failure Autopsies or evaluate playback!",
    placement: "bottom"
  },
  {
    targetId: "traces-nlp-query-input",
    title: "🗣️ Trace Natural Language Search",
    body: "Query the console directly using custom prompts. Perfect for senior analysts auditing model behaviors or locating overconfident traces immediately.",
    placement: "bottom"
  },
  {
    targetId: "share-session-button",
    title: "📤 DevPost Shareable Reports",
    body: "Lock in your high-accuracy healed session and compile a base64 encoded URL report! Send your best trace graphs to supervisors or judges instantly.",
    placement: "bottom"
  }
];
