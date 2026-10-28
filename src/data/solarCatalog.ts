import heroArchitectureImg from '../assets/images/hero_solar_architecture_1793198580756.jpg';
import solarBatteryImg from '../assets/images/product_solar_battery_1793198582814.jpg';
import solarFanImg from '../assets/images/product_solar_fan_1793198588702.jpg';
import solarGeneratorImg from '../assets/images/product_solar_generator_1793198581947.jpg';
import solarInverterImg from '../assets/images/product_solar_inverter_1793198585503.jpg';
import solarPanelImg from '../assets/images/product_solar_panel_1793198583939.jpg';
import { SolarCategorySlug, SolarProduct } from '../types';

export const HERO_SOLAR_IMAGE = heroArchitectureImg;

export const CATEGORY_FILTERS: { slug: 'all' | SolarCategorySlug; label: string }[] = [
  { slug: 'all', label: 'All Equipment' },
  { slug: 'solar-generator', label: 'Solar Generators' },
  { slug: 'solar-batteries', label: 'Solar Batteries' },
  { slug: 'solar-panel', label: 'Solar Panels' },
  { slug: 'solar-fans', label: 'Rechargeable Fans' },
  { slug: 'solar-inverter', label: 'Solar Inverters' },
];

export const FREE_FREIGHT_THRESHOLD_CENTS = 100000; // $1,000.00
export const STANDARD_FREIGHT_CENTS = 4500; // $45.00

export const SOLAR_CATALOG: SolarProduct[] = [
  {
    id: 'gen_titan_2000',
    sku: 'HSD-GEN-2000',
    name: 'TitanCore 2000W LiFePO4 Solar Power Generator',
    category: 'solar-generator',
    categoryLabel: 'Solar Generator',
    shortSpec: '2000W AC · 2048Wh LiFePO4',
    priceCents: 139900,
    wattageRating: 2000,
    stockCount: 14,
    warrantyYears: 5,
    summary:
      'Commercial-grade portable solar station with 2000W pure sine wave AC output (4000W surge), 800W MPPT fast solar input, and automotive LiFePO4 cells rated for 4,000+ cycles.',
    image: solarGeneratorImg,
    specs: [
      { label: 'Continuous AC Output', value: '2,000W Pure Sine Wave (4,000W Surge)' },
      { label: 'Battery Capacity', value: '2,048Wh Automotive LiFePO4' },
      { label: 'Max Solar Input', value: '800W MPPT (11V–60V DC)' },
      { label: 'Output Ports', value: '4x 120V AC, 2x 100W USB-C PD, 12V/10A DC' },
      { label: 'Cycle Lifespan', value: '4,000+ Cycles to 80% Capacity' },
      { label: 'Dimensions & Weight', value: '39.4 x 27.9 x 32.0 cm · 22.4 kg' },
    ],
  },
  {
    id: 'gen_nomad_1000',
    sku: 'HSD-GEN-1000',
    name: 'NomadPro 1000W Compact Solar Generator',
    category: 'solar-generator',
    categoryLabel: 'Solar Generator',
    shortSpec: '1000W AC · 1024Wh LiFePO4',
    priceCents: 74900,
    wattageRating: 1000,
    stockCount: 22,
    warrantyYears: 5,
    summary:
      'Silent home backup and field workstation generator delivering 1000W continuous output, <10ms UPS switchover for routers and desktops, and 1.8-hour dual solar/AC recharge.',
    image: solarGeneratorImg,
    specs: [
      { label: 'Continuous AC Output', value: '1,000W Pure Sine Wave (2,000W Surge)' },
      { label: 'Battery Capacity', value: '1,024Wh Prismatic LiFePO4' },
      { label: 'Max Solar Input', value: '500W MPPT Integrated Controller' },
      { label: 'UPS Transfer Time', value: '< 10 ms Automatic Switchover' },
      { label: 'Cycle Lifespan', value: '3,500+ Cycles to 80% Capacity' },
      { label: 'Dimensions & Weight', value: '34.0 x 23.2 x 25.6 cm · 12.1 kg' },
    ],
  },
  {
    id: 'bat_vault_48v100',
    sku: 'HSD-BAT-5120',
    name: 'HeliosVault 48V 100Ah Wall-Mount LiFePO4 Battery',
    category: 'solar-batteries',
    categoryLabel: 'Solar Battery',
    shortSpec: '5.12kWh · 48V 100Ah BMS',
    priceCents: 149500,
    wattageRating: 5120,
    stockCount: 11,
    warrantyYears: 10,
    summary:
      'Modular 5.12kWh wall-mounted lithium iron phosphate storage bank with active 100A smart BMS, CAN/RS485 closed-loop inverter telemetry, and parallel expansion up to 16 units.',
    image: solarBatteryImg,
    specs: [
      { label: 'Nominal Energy', value: '5,120Wh (51.2V Nominal · 100Ah)' },
      { label: 'Cell Chemistry', value: 'Tier-1 Prismatic LiFePO4 (UL1973)' },
      { label: 'Max Charge / Discharge', value: '100A Continuous (5.12kW)' },
      { label: 'Cycle Lifespan', value: '6,000+ Cycles at 80% DoD' },
      { label: 'Communications', value: 'CAN Bus / RS485 Hybrid Inverter Sync' },
      { label: 'Enclosure Rating', value: 'IP65 Brushed Anodized Steel · 46.5 kg' },
    ],
  },
  {
    id: 'bat_deep_12v200',
    sku: 'HSD-BAT-2560',
    name: 'EnduroCell 12.8V 200Ah Deep-Cycle Lithium Battery',
    category: 'solar-batteries',
    categoryLabel: 'Solar Battery',
    shortSpec: '2.56kWh · 12.8V 200Ah',
    priceCents: 68500,
    wattageRating: 2560,
    stockCount: 28,
    warrantyYears: 7,
    summary:
      'Drop-in deep-cycle 2.56kWh solar storage battery engineered with low-temperature charge protection, 150A BMS, and 4S4P series/parallel support for 12V, 24V, or 48V banks.',
    image: solarBatteryImg,
    specs: [
      { label: 'Nominal Energy', value: '2,560Wh (12.8V · 200Ah)' },
      { label: 'Built-In Protection', value: '150A BMS with Low-Temp Cutoff' },
      { label: 'Series / Parallel', value: 'Up to 4S4P (Max 51.2V 800Ah)' },
      { label: 'Cycle Lifespan', value: '5,000+ Cycles at 80% DoD' },
      { label: 'Terminal Hardware', value: 'M8 Heavy-Duty Copper Terminals' },
      { label: 'Dimensions & Weight', value: '52.2 x 24.0 x 21.8 cm · 21.8 kg' },
    ],
  },
  {
    id: 'pnl_vertex_450w',
    sku: 'HSD-PNL-450M',
    name: 'VertexBlack 450W N-Type Monocrystalline Solar Panel',
    category: 'solar-panel',
    categoryLabel: 'Solar Panel',
    shortSpec: '450W · 22.4% Efficiency',
    priceCents: 22500,
    wattageRating: 450,
    stockCount: 64,
    warrantyYears: 25,
    summary:
      'Architectural all-black 144-half-cut N-Type TOPCon photovoltaic module delivering 22.4% cell conversion efficiency, superior low-irradiance yield, and 5400Pa snow-load rating.',
    image: solarPanelImg,
    specs: [
      { label: 'Rated Peak Power (Pmax)', value: '450W (+0/+5W Positive Tolerance)' },
      { label: 'Module Efficiency', value: '22.4% N-Type Half-Cut TOPCon' },
      { label: 'Open-Circuit Voltage (Voc)', value: '49.6V DC' },
      { label: 'Short-Circuit Current (Isc)', value: '11.58A DC (MC4 Connectors)' },
      { label: 'Mechanical Load', value: '5,400Pa Front / 2,400Pa Wind' },
      { label: 'Dimensions & Weight', value: '190.3 x 113.4 x 3.0 cm · 21.5 kg' },
    ],
  },
  {
    id: 'pnl_bifacial_550w',
    sku: 'HSD-PNL-550B',
    name: 'HelioMax 550W Bifacial Dual-Glass Commercial Panel',
    category: 'solar-panel',
    categoryLabel: 'Solar Panel',
    shortSpec: '550W · +20% Bifacial Gain',
    priceCents: 27900,
    wattageRating: 550,
    stockCount: 40,
    warrantyYears: 25,
    summary:
      'High-output dual-glass bifacial solar module engineered for ground mounts, carports, and reflective rooftops, capturing rear-side albedo irradiance for up to 660W combined yield.',
    image: solarPanelImg,
    specs: [
      { label: 'Front Rated Power', value: '550W (Up to 660W with Rear Gain)' },
      { label: 'Cell Architecture', value: '144 Half-Cut Bifacial Monocrystalline' },
      { label: 'Open-Circuit Voltage (Voc)', value: '49.9V DC' },
      { label: 'Junction Box', value: 'IP68 Split-Box with 3 Bypass Diodes' },
      { label: 'Glass Construction', value: '2.0mm Dual Tempered Anti-Reflective' },
      { label: 'Dimensions & Weight', value: '227.8 x 113.4 x 3.5 cm · 27.8 kg' },
    ],
  },
  {
    id: 'fan_breeze_16dc',
    sku: 'HSD-FAN-16DC',
    name: 'AeroSolar 16" Brushless DC Rechargeable Pedestal Fan',
    category: 'solar-fans',
    categoryLabel: 'Rechargeable Fan',
    shortSpec: '25W DC · 18h Runtime + 20W Panel',
    priceCents: 11900,
    wattageRating: 25,
    stockCount: 48,
    warrantyYears: 2,
    summary:
      'Ultra-quiet brushless 12V DC standing pedestal fan with built-in 18,000mAh LiFePO4 battery pack, 9-speed airflow dial, USB device charging port, and dedicated 20W solar charging dock.',
    image: solarFanImg,
    specs: [
      { label: 'Motor Draw & Type', value: '25W Peak · Brushless Copper DC Motor' },
      { label: 'Integrated Battery', value: '18,000mAh LiFePO4 (6–18h Runtime)' },
      { label: 'Included Solar Dock', value: '20W Monocrystalline Panel + 5m Cable' },
      { label: 'Airflow & Noise', value: '2,450 CFM · Whisper 32 dBA Low Mode' },
      { label: 'Auxiliary Features', value: '5V/2A USB Port · Warm Night LED' },
      { label: 'Height Adjustment', value: '105 cm – 135 cm Steel Pedestal' },
    ],
  },
  {
    id: 'fan_circulator_12dc',
    sku: 'HSD-FAN-12DC',
    name: 'Zephyr 12" All-Metal Rechargeable Solar Floor & Desk Fan',
    category: 'solar-fans',
    categoryLabel: 'Rechargeable Fan',
    shortSpec: '18W DC · 24h Runtime + 15W Panel',
    priceCents: 8900,
    wattageRating: 18,
    stockCount: 35,
    warrantyYears: 2,
    summary:
      'Compact powder-coated aluminum air circulator designed for bedrooms, cabins, and off-grid workspaces, running up to 24 hours on low speed with direct solar DC pass-through charging.',
    image: solarFanImg,
    specs: [
      { label: 'Motor Draw & Type', value: '18W Peak · High-Torque Brushless DC' },
      { label: 'Integrated Battery', value: '15,000mAh LiFePO4 (8–24h Runtime)' },
      { label: 'Included Solar Panel', value: '15W Weatherproof Monocrystalline Dock' },
      { label: 'Tilt & Oscillation', value: '120° Vertical Tilt · Stepless Speed' },
      { label: 'Dual Charging', value: 'Solar DC Input + AC Wall Adapter' },
      { label: 'Dimensions & Weight', value: '36.5 x 19.0 x 38.0 cm · 3.4 kg' },
    ],
  },
  {
    id: 'inv_hybrid_5kva',
    sku: 'HSD-INV-5K48',
    name: 'HeliosGrid 5kVA 48V Pure Sine Wave Hybrid MPPT Inverter',
    category: 'solar-inverter',
    categoryLabel: 'Solar Inverter',
    shortSpec: '5000W · 48V · 100A MPPT',
    priceCents: 84900,
    wattageRating: 5000,
    stockCount: 16,
    warrantyYears: 5,
    summary:
      'All-in-one 5kVA / 5000W 48V hybrid solar inverter combining a high-voltage 500V PV MPPT solar controller, utility/generator AC charger, batteryless solar-first operation, and BMS sync.',
    image: solarInverterImg,
    specs: [
      { label: 'Rated Continuous Power', value: '5,000VA / 5,000W (10,000VA Surge)' },
      { label: 'Nominal DC Bus', value: '48V DC (Supports LiFePO4, AGM, Gel)' },
      { label: 'MPPT Solar Charger', value: '100A Max · 120V–450V DC PV Window' },
      { label: 'Max PV Array Power', value: '5,500W Solar Input' },
      { label: 'Peak Conversion Efficiency', value: '97.6% PV-to-AC · <10ms UPS Transfer' },
      { label: 'Parallel Capability', value: 'Up to 6 Units Single/Three-Phase' },
    ],
  },
  {
    id: 'inv_hybrid_8kva',
    sku: 'HSD-INV-8K48',
    name: 'HeliosGrid Pro 8kVA Split-Phase Hybrid Solar Inverter',
    category: 'solar-inverter',
    categoryLabel: 'Solar Inverter',
    shortSpec: '8000W · Dual MPPT · 120/240V',
    priceCents: 159000,
    wattageRating: 8000,
    stockCount: 9,
    warrantyYears: 5,
    summary:
      'Whole-home and commercial 8kVA split-phase 120V/240V hybrid inverter featuring dual independent MPPT trackers (10,400W PV max), IP65 weather-sealed chassis, and zero-export CT sensing.',
    image: solarInverterImg,
    specs: [
      { label: 'Rated Continuous Power', value: '8,000VA / 8,000W Split-Phase 120/240V' },
      { label: 'Dual MPPT Trackers', value: '2x Independent Strings · 10,400W Max PV' },
      { label: 'Max Battery Charge', value: '190A Continuous @ 48V Nominal' },
      { label: 'Grid & Generator Ports', value: 'Dedicated Smart Load & Gen Auto-Start' },
      { label: 'Enclosure Protection', value: 'IP65 Die-Cast Aluminum Heatsink' },
      { label: 'Dimensions & Weight', value: '58.0 x 42.5 x 23.0 cm · 34.0 kg' },
    ],
  },
];

export interface LoadAppliancePreset {
  id: string;
  name: string;
  watts: number;
  defaultCount: number;
}

export const LOAD_APPLIANCE_PRESETS: LoadAppliancePreset[] = [
  { id: 'led_lights', name: 'LED Room Lights', watts: 12, defaultCount: 6 },
  { id: 'solar_fan', name: 'DC Rechargeable Standing Fan', watts: 25, defaultCount: 2 },
  { id: 'fridge', name: 'Inverter Refrigerator / Freezer', watts: 140, defaultCount: 1 },
  { id: 'workstation', name: 'Laptop + Fiber Wi-Fi Router', watts: 85, defaultCount: 2 },
  { id: 'tv', name: '55" Smart LED Television', watts: 110, defaultCount: 1 },
  { id: 'pump', name: 'Submersible / Booster Water Pump', watts: 550, defaultCount: 0 },
];
