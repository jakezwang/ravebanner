// src/lib/options.ts
import { Option } from '@/components/MultiSelect'

export const languageOptions: Option[] = [
  "English", "Spanish", "Mandarin Chinese", "French", "German", "Portuguese",
  "Russian", "Japanese", "Korean", "Hindi", "Arabic", "Italian", "Dutch",
  "Polish", "Turkish", "Vietnamese", "Thai", "Indonesian", "Hebrew", "Swedish"
].map(lang => ({ value: lang, label: lang }))

export const genreOptions: Option[] = [
  "Techno", "House", "Dubstep", "Drum & Bass", "Trance",
  "EDM", "Hardstyle", "Bass", "Trap", "Psytrance",
  "Electro", "Progressive", "Deep House", "Future Bass", "Hardcore"
].map(g => ({ value: g, label: g }))

export const locationOptions: Option[] = [
  "California 🇺🇸", "Texas 🇺🇸", "Florida 🇺🇸", "New York 🇺🇸", "Nevada 🇺🇸",
  "Illinois 🇺🇸", "Georgia 🇺🇸", "Arizona 🇺🇸", "Washington 🇺🇸", "Colorado 🇺🇸",
  "Michigan 🇺🇸", "Massachusetts 🇺🇸", "Tennessee 🇺🇸", "Pennsylvania 🇺🇸",
  "North Carolina 🇺🇸", "Ohio 🇺🇸", "New Jersey 🇺🇸", "Virginia 🇺🇸", "Minnesota 🇺🇸",
  "Oregon 🇺🇸", "Indiana 🇺🇸", "Missouri 🇺🇸", "Wisconsin 🇺🇸", "Maryland 🇺🇸",
  "South Carolina 🇺🇸", "Louisiana 🇺🇸", "Alabama 🇺🇸", "Connecticut 🇺🇸",
  "Utah 🇺🇸", "Iowa 🇺🇸", "Hawaii 🇺🇸", "District of Columbia 🇺🇸",

  "New York City 🇺🇸", "Los Angeles 🇺🇸", "Chicago 🇺🇸", "Houston 🇺🇸",
  "Phoenix 🇺🇸", "Philadelphia 🇺🇸", "San Antonio 🇺🇸", "San Diego 🇺🇸",
  "Dallas 🇺🇸", "San Jose 🇺🇸", "Austin 🇺🇸", "Jacksonville 🇺🇸",
  "Fort Worth 🇺🇸", "Columbus 🇺🇸", "Charlotte 🇺🇸", "San Francisco 🇺🇸",
  "Indianapolis 🇺🇸", "Seattle 🇺🇸", "Denver 🇺🇸", "Washington DC 🇺🇸",
  "Salt Lake City 🇺🇸", "Las Vegas 🇺🇸", "Orlando 🇺🇸", "Miami 🇺🇸", "Boston 🇺🇸",

  "Suzhou 🇨🇳", "Zhuhai 🇨🇳", "Chengdu 🇨🇳", "Amsterdam 🇳🇱", "Berlin 🇩🇪",
  "Barcelona 🇪🇸", "Paris 🇫🇷", "London 🇬🇧", "Brussels 🇧🇪", "Zurich 🇨🇭",
  "Prague 🇨🇿", "Vienna 🇦🇹", "Belgrade 🇷🇸", "Tokyo 🇯🇵", "Seoul 🇰🇷",
  "Bangkok 🇹🇭", "Singapore 🇸🇬", "Taipei 🇹🇼", "Shanghai 🇨🇳", "Beijing 🇨🇳",
  "Bali 🇮🇩", "Goa 🇮🇳", "Kuala Lumpur 🇲🇾", "Melbourne 🇦🇺", "Sydney 🇦🇺",

  "USA 🇺🇸", "Canada 🇨🇦", "Mexico 🇲🇽", "Brazil 🇧🇷", "Germany 🇩🇪",
  "UK 🇬🇧", "France 🇫🇷", "Netherlands 🇳🇱", "Spain 🇪🇸", "Belgium 🇧🇪",
  "India 🇮🇳", "Australia 🇦🇺", "South Korea 🇰🇷", "Japan 🇯🇵",
  "Thailand 🇹🇭", "China 🇨🇳", "Vietnam 🇻🇳", "Malaysia 🇲🇾",
  "Philippines 🇵🇭", "Indonesia 🇮🇩", "Singapore 🇸🇬"
].map(loc => ({ value: loc, label: loc }))

export const festivalOptions: Option[] = [
    // 🔥 North America
    "EDC Las Vegas", "EDC Mexico", "Electric Forest", "Ultra Miami", "Coachella", "Lollapalooza",
    "Electric Zoo", "Beyond Wonderland", "Escape Halloween", "Nocturnal Wonderland",
    "Hard Summer", "Dreamstate", "Lost Lands", "Bass Canyon", "Imagine Festival",
    "Breakaway Festival", "Skyline Festival", "Audiotistic", "CRSSD Festival",
    "Lightning in a Bottle", "Hulaween", "Okeechobee Festival", "Euphoria",
    "Project Glow", "Countdown NYE", "Holy Ship!", "FriendShip",
    "Decadence Arizona", "Decadence Colorado", "Elements Festival",
    "Moonrise Festival", "North Coast Music Festival", "Summer Camp",
    "Shambhala", "Veld Music Festival", "ÎLESONIQ", "FVDED in the Park",
  
    // 🌍 Europe
    "Tomorrowland", "Tomorrowland Winter", "Creamfields", "Mysteryland",
    "Awakenings", "Time Warp", "DGTL", "Defqon.1", "Airbeat One",
    "Sonus Festival", "Exit Festival", "Parookaville", "Sziget Festival",
    "Amsterdam Dance Event", "Love Parade", "Boom Festival", "Balaton Sound",
    "Hideout Festival", "Untold Festival", "Sea Dance Festival",
    "Monegros Desert Festival", "Les Plages Électroniques", "Kappa FuturFestival",
  
    // 🌏 Asia
    "EDC China", "EDC Japan", "Ultra Japan", "Ultra Korea", "Ultra Taiwan", "Ultra Singapore",
    "Ultra India", "Ultra Bali", "ZoukOut", "S2O Songkran", "Sunburn Festival", "It's the Ship",
    "Djakarta Warehouse Project", "Transmission Thailand", "Wonderfruit", "808 Festival",
    "Creamfields Hong Kong", "Creamfields Thailand", "Incheon Pentaport Rock Festival",
    "Kolour in the Park", "EPIZODE", "Wired Music Festival", "Summer Sonic", "Spectrum Dance Festival",
    "It’s the Ship Korea", "S2O Taiwan", "We The Fest", "Gravity Festival", "Phoenix Music Festival",
  
    // 🇦🇺 Australia / New Zealand
    "EDC Australia", "Pitch Music & Arts", "Rabbits Eat Lettuce", "Splendour in the Grass",
    "Festival X", "Let Them Eat Cake", "Subsonic Music Festival",
    "Earthcore", "Rainbow Serpent", "Listen Out", "Origin Fields",
  
    // 🌎 South America
    "Lollapalooza Argentina", "Lollapalooza Brazil", "Lollapalooza Chile",
    "XXXPerience", "Green Valley", "Creamfields Chile", "Rock in Rio",
    "Storyland Colombia", "Festival Estereo Picnic", "Ultra Brazil",
  
    // 🔮 Niche / Art / Transformational
    "Burning Man", "Desert Hearts", "Dirtybird Campout", "Envision Festival",
    "Secret Project", "The BPM Festival", "Lucidity Festival",
    "Bass Coast", "Camp Bisco", "What The Festival", "High Ground Festival",
    "Oregon Eclipse", "Symbiosis Gathering", "Tmrw.Tday", "Sunrise Festival"
  ].map(f => ({ value: f, label: f }))
  