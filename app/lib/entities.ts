import type { Listing } from "./types";

// ---------------------------------------------------------------------------
// Property ownership & acquisition metadata (from the owner's spreadsheet).
//
// Keyed to listing ids. A physical property can map to several listings
// (duplex/triplex units + "2 Homes" bundles), which all share one purchase
// record. Listings not present here (e.g. Eden Roc) have no acquisition data.
//
// `entity` is the legal owner. Estimates are point-in-time Zillow/Redfin pulls.
// ---------------------------------------------------------------------------

export interface PropertyMeta {
  entity: string;
  address: string;
  purchaseDate: string; // "YYYY-MM-DD"
  purchasePrice: number;
  zillow?: string;
  redfin?: string;
  zestimate?: number;
  redfinEstimate?: number;
  avgEstimate?: number;
  listingIds: string[];
}

export const PROPERTIES: PropertyMeta[] = [
  {
    entity: "R2 Capital Partners (US) Inc",
    address: "261 Fletcher St SW, Atlanta, GA, 30315",
    purchaseDate: "2020-05-11",
    purchasePrice: 285000,
    zillow: "https://www.zillow.com/homedetails/261-Fletcher-St-SW-Atlanta-GA-30315/35887944_zpid/",
    redfin: "https://www.redfin.com/GA/Atlanta/261-Fletcher-St-SW-30315/home/24766243",
    zestimate: 436500,
    redfinEstimate: 429900,
    avgEstimate: 433200,
    listingIds: [
      "66b3e6da05f53c0013773384",
      "5efe847ec6cabb002a1f6d5a",
      "63f67c0a98d8e00042b2afad",
      "64c1265bcf9d6d00366a3fbc",
      "5f3cc2b31437a20028c9a6bc",
      "60ccf0fca30e26002dc25a93",
      "6545585b403d05004ff506f9",
      "60ccf0fad23580002e480d4d",
    ],
  },
  {
    entity: "R2 Capital Partners (US) Inc",
    address: "1326 Mcpherson Ave SE, Atlanta, GA, 30316",
    purchaseDate: "2020-05-11",
    purchasePrice: 420000,
    zillow: "https://www.zillow.com/homedetails/1326-Mcpherson-Ave-SE-Atlanta-GA-30316/14456394_zpid/",
    redfin: "https://www.redfin.com/GA/Atlanta/1326-McPherson-Ave-SE-30316/home/23833925",
    zestimate: 619900,
    redfinEstimate: 619900,
    avgEstimate: 619900,
    listingIds: ["5eed5d8f9caa3c002d19b032"],
  },
  {
    entity: "R2 Capital Partners (US) Inc",
    address: "4412 2nd Ave E, Northport, AL, 35473",
    purchaseDate: "2021-06-30",
    purchasePrice: 175900,
    zillow: "https://www.zillow.com/homedetails/4412-2nd-Ave-E-Northport-AL-35473/50874863_zpid/",
    redfin: "https://www.redfin.com/AL/Northport/4412-2nd-Ave-E-35473/home/136077652",
    zestimate: 233400,
    redfinEstimate: 235748,
    avgEstimate: 234574,
    listingIds: ["6130f53e1caebe002e7b34ff"],
  },
  {
    entity: "R2CP (US) Inc",
    address: "4454 E 3rd Ave, Northport, AL, 35473",
    purchaseDate: "2021-06-30",
    purchasePrice: 196500,
    zillow: "https://www.zillow.com/homedetails/4454-3rd-Ave-E-Northport-AL-35473/89730970_zpid/",
    redfin: "https://www.redfin.com/AL/Northport/4454-3rd-Ave-E-35473/home/135862044",
    zestimate: 266300,
    redfinEstimate: 266860,
    avgEstimate: 266580,
    listingIds: ["61313cb1539c7d002e960f97"],
  },
  {
    entity: "R2CP (US) Inc",
    address: "20050 Brookwood Dr, South Bend IN, 46637",
    purchaseDate: "2021-07-09",
    purchasePrice: 215000,
    zillow: "https://www.zillow.com/homedetails/20050-Brookwood-Dr-South-Bend-IN-46637/77042433_zpid/",
    redfin: "https://www.redfin.com/IN/South-Bend/20050-Brookwood-Dr-46637/home/138711147",
    zestimate: 296400,
    redfinEstimate: 358218,
    avgEstimate: 327309,
    listingIds: ["613a94d86df8700030f910a9"],
  },
  {
    entity: "R2CP (US) Inc",
    address: "301 W Pendle St, South Bend, IN, 46637",
    purchaseDate: "2021-08-05",
    purchasePrice: 195075,
    zillow: "https://www.zillow.com/homedetails/301-W-Pendle-St-South-Bend-IN-46637/94580127_zpid/",
    redfin: "https://www.redfin.com/IN/South-Bend/301-W-Pendle-St-46637/home/138989544",
    zestimate: 208100,
    redfinEstimate: 221682,
    avgEstimate: 214891,
    listingIds: ["613a7949473ced0032fb2a60"],
  },
  {
    entity: "R2 Capital Partners (US) Inc",
    address: "2111 23rd St, Northport, AL, 35476",
    purchaseDate: "2021-10-04",
    purchasePrice: 246000,
    zillow: "https://www.zillow.com/homedetails/2111-23rd-St-Northport-AL-35476/50878097_zpid/",
    redfin: "https://www.redfin.com/AL/Northport/2111-23rd-St-35476/home/135945788",
    zestimate: 299600,
    redfinEstimate: 263415,
    avgEstimate: 281508,
    listingIds: ["61a8fa919255000034f8c927"],
  },
  {
    entity: "R2 Capital Partners (US) Inc",
    address: "2710 Hedgewood Dr NW, Atlanta, GA, 30311",
    purchaseDate: "2021-10-07",
    purchasePrice: 406500,
    zillow: "https://www.zillow.com/homedetails/2710-Hedgewood-Dr-NW-Atlanta-GA-30311/35865885_zpid/",
    redfin: "https://www.redfin.com/GA/Atlanta/2710-Hedgewood-Dr-NW-30311/home/24762791",
    zestimate: 439500,
    redfinEstimate: 408537,
    avgEstimate: 424019,
    listingIds: ["619931d292c69500347d707d"],
  },
  {
    entity: "R2CP (US) Inc",
    address: "1701 Rerick St, South Bend, IN, 46635",
    purchaseDate: "2021-12-31",
    purchasePrice: 200000,
    zillow: "https://www.zillow.com/homedetails/1701-Rerick-St-South-Bend-IN-46635/77050444_zpid/",
    redfin: "https://www.redfin.com/IN/South-Bend/1701-Rerick-St-46635/home/139058484",
    zestimate: 236800,
    redfinEstimate: 246071,
    avgEstimate: 241436,
    listingIds: ["61e5e7099974fe0032f7ef51"],
  },
  {
    entity: "R2CP (US) Inc",
    address: "19793 Greenacre St, South Bend, IN, 46637",
    purchaseDate: "2022-05-17",
    purchasePrice: 146000,
    zillow: "https://www.zillow.com/homedetails/19793-Greenacre-St-South-Bend-IN-46637/77042796_zpid/",
    redfin: "https://www.redfin.com/IN/South-Bend/19793-Greenacre-St-46637/home/138783819",
    zestimate: 168800,
    redfinEstimate: 158133,
    avgEstimate: 163467,
    listingIds: ["62bb09f5d473bb00328b46c1"],
  },
  {
    entity: "R2 Capital Partners (US) Inc",
    address: "2715 Forest Brk, Northport, AL, 35476",
    purchaseDate: "2022-06-03",
    purchasePrice: 255000,
    zillow: "https://www.zillow.com/homedetails/2715-Forest-Brk-Northport-AL-35476/83273873_zpid/",
    redfin: "https://www.redfin.com/AL/Northport/2715-Forest-Brk-35476/home/135979781",
    zestimate: 293200,
    redfinEstimate: 259975,
    avgEstimate: 276588,
    listingIds: ["62bf3b94ad2dd0003400bfd5"],
  },
  {
    entity: "R2 SFH US INC",
    address: "7312 2nd Ave N, Birmingham, AL 35206",
    purchaseDate: "2022-09-16",
    purchasePrice: 170000,
    zillow: "https://www.zillow.com/homedetails/7312-2nd-Ave-N-Birmingham-AL-35206/953008_zpid/",
    redfin: "https://www.redfin.com/AL/Birmingham/7312-2nd-Ave-N-35206/home/80920692",
    zestimate: 162600,
    redfinEstimate: 152040,
    avgEstimate: 157320,
    listingIds: ["666ca406689c45000f74d545"],
  },
  {
    entity: "R2 SFH US INC",
    address: "1506 24th Ave (2401 16th Ave), Northport, AL 35476",
    purchaseDate: "2022-10-04",
    purchasePrice: 179500,
    zillow: "https://www.zillow.com/homedetails/2401-16th-Ave-Northport-AL-35476/50878500_zpid/",
    redfin: "https://www.redfin.com/AL/Northport/2401-16th-Ave-35476/home/135987261",
    zestimate: 207900,
    redfinEstimate: 193754,
    avgEstimate: 200827,
    listingIds: ["639d2caaed464f0057cc96ae"],
  },
  {
    entity: "R2CP (US) Inc",
    address: "4002 38th Ave, Northport, AL 35473",
    purchaseDate: "2023-01-06",
    purchasePrice: 217000,
    zillow: "https://www.zillow.com/homedetails/4002-38th-Ave-Northport-AL-35473/50877415_zpid/",
    redfin: "https://www.redfin.com/AL/Northport/4002-38th-Ave-35473/home/135716829",
    zestimate: 240500,
    redfinEstimate: 231094,
    avgEstimate: 235797,
    listingIds: ["642b2ee56788d600369538c4"],
  },
  {
    entity: "R2 SFH US INC",
    address: "356 Flint St, Mobile, AL 36604",
    purchaseDate: "2023-03-24",
    purchasePrice: 240000,
    zillow: "https://www.zillow.com/homedetails/356-Flint-St-Mobile-AL-36604/51023100_zpid/",
    redfin: "https://www.redfin.com/AL/Mobile/356-Flint-St-36604/home/131056411",
    zestimate: 238800,
    redfinEstimate: 238070,
    avgEstimate: 238435,
    listingIds: [
      "647f923a6333b200497436be",
      "647f67c8e7f68c004acc3ab5",
      "647f8743f7c0c70053023712",
    ],
  },
  {
    entity: "R2 SFH US INC",
    address: "808 Charles St, Mobile, AL 36604",
    purchaseDate: "2023-02-11",
    purchasePrice: 135000,
    zillow: "https://www.zillow.com/homedetails/808-Charles-St-Mobile-AL-36604/51025527_zpid/",
    redfin: "https://www.redfin.com/AL/Mobile/808-Charles-St-36604/home/131192690",
    zestimate: 132800,
    redfinEstimate: 166236,
    avgEstimate: 149518,
    listingIds: ["63eafd662baf92002cc1dbac"],
  },
  {
    entity: "R2 SFH US INC",
    address: "2563 Courtney St S, Mobile, AL 36606",
    purchaseDate: "2023-05-23",
    purchasePrice: 155000,
    zillow: "https://www.zillow.com/homedetails/2563-Courtney-St-S-Mobile-AL-36606/51021717_zpid/",
    redfin: "https://www.redfin.com/AL/Mobile/2563-Courtney-St-S-36606/home/131097038",
    zestimate: 167000,
    redfinEstimate: 186801,
    avgEstimate: 176901,
    listingIds: ["64a42b6104bd25002e274056"],
  },
  {
    entity: "R2 SFH US INC",
    address: "759 Fountain View Dr, Baton Rouge, LA 70820",
    purchaseDate: "2023-07-06",
    purchasePrice: 205000,
    zillow: "https://www.zillow.com/homedetails/759-Fountain-View-Dr-Baton-Rouge-LA-70820/66254207_zpid/",
    redfin: "https://www.redfin.com/LA/Baton-Rouge/759-Fountain-View-Dr-70820/home/82817841",
    zestimate: 206500,
    redfinEstimate: 181191,
    avgEstimate: 193846,
    listingIds: ["64c94678122f53003f89ae68"],
  },
  {
    entity: "R2 SFH US INC",
    address: "8915 Nolen Dr, Baton Rouge, LA 70810",
    purchaseDate: "2023-07-07",
    purchasePrice: 225000,
    zillow: "https://www.zillow.com/homedetails/8915-Nolen-Dr-Baton-Rouge-LA-70810/66288889_zpid/",
    redfin: "https://www.redfin.com/LA/Baton-Rouge/8915-Nolen-Dr-70810/home/85645478",
    zestimate: 223700,
    redfinEstimate: 235164,
    avgEstimate: 229432,
    listingIds: ["64ce609ba7aa59002ca7d220"],
  },
  {
    entity: "R2 SFH US INC",
    address: "1132 Five Mile Rd, Birmingham, AL 35215",
    purchaseDate: "2023-08-29",
    purchasePrice: 247000,
    zillow: "https://www.zillow.com/homedetails/1132-Five-Mile-Rd-Birmingham-AL-35215/906116_zpid/",
    redfin: "https://www.redfin.com/AL/Birmingham/1132-Five-Mile-Rd-35215/home/80879066",
    zestimate: 241900,
    redfinEstimate: 250779,
    avgEstimate: 246340,
    listingIds: ["64e3e0ba67db7c004ce84d18"],
  },
  {
    entity: "R2CP (US) Inc",
    address: "509 Monterey Dr, Northport, AL, 35473",
    purchaseDate: "2023-08-31",
    purchasePrice: 215400,
    zillow: "https://www.zillow.com/homedetails/509-Monterey-Dr-Northport-AL-35473/35742979_zpid/",
    redfin: "https://www.redfin.com/AL/Northport/509-Monterey-Dr-35473/home/135811935",
    zestimate: 225500,
    redfinEstimate: 216313,
    avgEstimate: 220907,
    listingIds: ["653662be9cb4e70033a64de9"],
  },
  {
    entity: "R2 SFH US INC",
    address: "522 Taylor St, Jackson, MS 39216",
    purchaseDate: "2023-10-13",
    purchasePrice: 133000,
    zillow: "https://www.zillow.com/homedetails/522-Taylor-St-Jackson-MS-39216/3033412_zpid/",
    redfin: "https://www.redfin.com/MS/Jackson/522-Taylor-St-39216/home/117420273",
    zestimate: 144400,
    redfinEstimate: 115327,
    avgEstimate: 129864,
    listingIds: ["656fb31e95a6e2001b0932ea"],
  },
  {
    entity: "R2 SFH US INC",
    address: "731 10th Ave S, Birmingham, AL 35205",
    purchaseDate: "2023-10-24",
    purchasePrice: 337000,
    zillow: "https://www.zillow.com/homedetails/731-10th-Ave-S-Birmingham-AL-35205/990473_zpid/",
    redfin: "https://www.redfin.com/AL/Birmingham/731-10th-Ave-S-35205/home/80959433",
    zestimate: 331800,
    redfinEstimate: 443608,
    avgEstimate: 387704,
    listingIds: ["652ee1e42711f200313b5527"],
  },
  {
    entity: "R2 SFH US INC",
    address: "3501 Moss Ln, Amarillo, TX 79109",
    purchaseDate: "2023-11-01",
    purchasePrice: 256000,
    zillow: "https://www.zillow.com/homedetails/3501-Moss-Ln-Amarillo-TX-79109/50662877_zpid/",
    redfin: "https://www.redfin.com/TX/Amarillo/3501-Moss-Ln-79109/home/142156683",
    zestimate: 261900,
    redfinEstimate: 219605,
    avgEstimate: 240753,
    listingIds: [
      "653bf666ae8577002cdcbe15",
      "653bffc541c5830036868cea",
      "653c02a79c1bb100337a6b31",
    ],
  },
  {
    entity: "R2 SFH US INC",
    address: "2660 Hollybrook Dr, Mobile, AL 36605",
    purchaseDate: "2024-02-02",
    purchasePrice: 150000,
    zillow: "https://www.zillow.com/homedetails/2660-Hollybrook-Dr-Mobile-AL-36605/51029087_zpid/",
    redfin: "https://www.redfin.com/AL/Mobile/2660-Hollybrook-Dr-36605/home/130857344",
    zestimate: 153400,
    redfinEstimate: 162125,
    avgEstimate: 157763,
    listingIds: ["65f087e8a7832b00333b4227"],
  },
  {
    entity: "R2 SFH US INC",
    address: "2624 5th Way NW, Center Point, AL 35215",
    purchaseDate: "2024-03-05",
    purchasePrice: 161000,
    zillow: "https://www.zillow.com/homedetails/2624-5th-Way-NW-Center-Point-AL-35215/901247_zpid/",
    redfin: "https://www.redfin.com/AL/Center-Point/2624-5th-Way-NW-35215/home/80873527",
    zestimate: 147400,
    redfinEstimate: 195995,
    avgEstimate: 171698,
    listingIds: ["66317b43053dd50047791744"],
  },
];

export const UNASSIGNED_ENTITY = "Unassigned";

// Consistent color per legal entity (font color class), matching the owner's
// spreadsheet color coding. Falls back to slate for anything unmapped.
const ENTITY_COLORS: Record<string, string> = {
  "R2 Capital Partners (US) Inc": "text-blue-600",
  "R2CP (US) Inc": "text-amber-600",
  "R2 SFH US INC": "text-emerald-600",
  [UNASSIGNED_ENTITY]: "text-slate-400",
};

export function entityColorClass(entity?: string): string {
  return (entity && ENTITY_COLORS[entity]) || "text-slate-500";
}

export function metaByListingId(): Map<string, PropertyMeta> {
  const map = new Map<string, PropertyMeta>();
  for (const p of PROPERTIES) for (const id of p.listingIds) map.set(id, p);
  return map;
}

export function allEntities(): string[] {
  return [...new Set(PROPERTIES.map((p) => p.entity))].sort();
}

// Attach entity + acquisition metadata onto each listing.
export function withEntities(listings: Listing[]): Listing[] {
  const map = metaByListingId();
  return listings.map((l) => {
    const meta = map.get(l.id);
    return { ...l, entity: meta?.entity ?? UNASSIGNED_ENTITY, meta };
  });
}
