import { supabase, isSupabaseReady } from '../config/supabase';

// Announcements Feed Functions - Now shows all profile comments from all wallets
export const getAnnouncementsFeed = async () => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      console.warn('Supabase not configured, returning empty feed');
      return { data: [], error: null };
    }

    // Fetch all profile comments from all wallets, sorted by newest first
    const { data, error } = await supabase
      .from('profile_comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching announcements feed:', error);
    return { data: [], error };
  }
};

// User Profile Comments Functions
export const getProfileComments = async (walletAddress) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      console.warn('Supabase not configured, returning empty comments');
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('profile_comments')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile comments:', error);
    return { data: [], error };
  }
};

export const addProfileComment = async (walletAddress, comment, author = 'Admin') => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      const errorMsg = 'Supabase is not configured. Please set up your Supabase credentials in .env file.';
      console.error(errorMsg);
      return { data: null, error: new Error(errorMsg) };
    }

    const { data, error } = await supabase
      .from('profile_comments')
      .insert([
        {
          wallet_address: walletAddress,
          comment: comment,
          author: author,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error adding comment:', error);
      throw error;
    }
    
    console.log('✅ Comment added successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error adding profile comment:', error);
    return { data: null, error };
  }
};

export const deleteProfileComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('profile_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting profile comment:', error);
    return { error };
  }
};

