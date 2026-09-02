require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPERBASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPERBASE_SECRET_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) throw new Error('Supabase URL not set in environment (SUPERBASE_URL or SUPABASE_URL)');
if (!supabaseKey) throw new Error('Supabase key not set in environment (SUPERBASE_SECRET_KEY or SUPABASE_KEY)');

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;