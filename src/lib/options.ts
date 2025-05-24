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
