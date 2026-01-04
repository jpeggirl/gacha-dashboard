import { supabase, isSupabaseReady } from '../config/supabase';

// Announcements Feed Functions - Now shows all profile comments from all wallets
export const getAnnouncementsFeed = async () => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      // Warning already shown by config
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
      // Warning already shown by config
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
      .maybeSingle();

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

// User Profile Functions - Tag Management
export const getUserProfile = async (walletAddress) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      // Only log warning once to reduce console noise
      if (!window.supabaseServiceWarningShown) {
        console.warn('Supabase not configured, returning empty profile');
        window.supabaseServiceWarningShown = true;
      }
      return { data: null, error: null };
    }

    // Use maybeSingle() instead of single() to avoid 406 errors when no record exists
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      // Log the error for debugging
      console.error('Supabase query error:', error);
      throw error;
    }
    
    return { data: data || null, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

export const getUserTags = async (walletAddress) => {
  try {
    const { data, error } = await getUserProfile(walletAddress);
    if (error) throw error;
    return { data: (data?.tags || []), error: null };
  } catch (error) {
    console.error('Error fetching user tags:', error);
    return { data: [], error };
  }
};

export const addUserTag = async (walletAddress, tag, author = 'Admin') => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      const errorMsg = 'Supabase is not configured. Please set up your Supabase credentials in Vercel environment variables.';
      // Only show error once to reduce console noise
      if (!window.supabaseAddTagErrorShown) {
        console.error(errorMsg);
        if (!import.meta.env.DEV) {
          window.supabaseAddTagErrorShown = true;
        }
      }
      return { data: null, error: new Error(errorMsg) };
    }

    // First, try to get existing profile
    const { data: existingProfile, error: fetchError } = await getUserProfile(walletAddress);
    
    let tags = [];
    if (existingProfile && existingProfile.tags) {
      tags = Array.isArray(existingProfile.tags) ? [...existingProfile.tags] : [];
    }

    // Check if tag already exists
    if (tags.includes(tag)) {
      return { data: existingProfile, error: null }; // Tag already exists, return existing
    }

    // Add the new tag
    tags.push(tag);

    // Upsert the profile
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: walletAddress,
        tags: tags,
        created_by: author,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error adding tag:', error);
      throw error;
    }
    
    console.log('✅ Tag added successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error adding user tag:', error);
    return { data: null, error };
  }
};

export const removeUserTag = async (walletAddress, tag) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      const errorMsg = 'Supabase is not configured. Please set up your Supabase credentials in Vercel environment variables.';
      // Only show error once to reduce console noise
      if (!window.supabaseRemoveTagErrorShown) {
        console.error(errorMsg);
        if (!import.meta.env.DEV) {
          window.supabaseRemoveTagErrorShown = true;
        }
      }
      return { data: null, error: new Error(errorMsg) };
    }

    // Get existing profile
    const { data: existingProfile, error: fetchError } = await getUserProfile(walletAddress);
    
    if (fetchError || !existingProfile) {
      return { data: null, error: new Error('Profile not found') };
    }

    let tags = Array.isArray(existingProfile.tags) ? [...existingProfile.tags] : [];
    
    // Remove the tag
    tags = tags.filter(t => t !== tag);

    // Update the profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        tags: tags,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error removing tag:', error);
      throw error;
    }
    
    console.log('✅ Tag removed successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error removing user tag:', error);
    return { data: null, error };
  }
};

export const updateUserProfile = async (walletAddress, updates, author = 'Admin') => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      const errorMsg = 'Supabase is not configured. Please set up your Supabase credentials in Vercel environment variables.';
      // Only show error once to reduce console noise
      if (!window.supabaseUpdateProfileErrorShown) {
        console.error(errorMsg);
        if (!import.meta.env.DEV) {
          window.supabaseUpdateProfileErrorShown = true;
        }
      }
      return { data: null, error: new Error(errorMsg) };
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // If wallet_address is not in updates, add it for upsert
    if (!updateData.wallet_address) {
      updateData.wallet_address = walletAddress;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(updateData, {
        onConflict: 'wallet_address'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error updating profile:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

export const getAllTags = async () => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      // Warning already shown by getUserProfile
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('tags');

    if (error) throw error;

    // Extract all unique tags from all profiles
    const allTags = new Set();
    if (data) {
      data.forEach(profile => {
        if (Array.isArray(profile.tags)) {
          profile.tags.forEach(tag => allTags.add(tag));
        }
      });
    }

    return { data: Array.from(allTags).sort(), error: null };
  } catch (error) {
    console.error('Error fetching all tags:', error);
    return { data: [], error };
  }
};

export const getUserProfilesByTags = async (tags) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseReady) {
      // Warning already shown by config
      return { data: [], error: null };
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return { data: [], error: null };
    }

    // Query profiles that contain any of the specified tags
    // Using .contains() with each tag and combining results
    // Note: Supabase PostgREST doesn't have direct array overlap support,
    // so we'll fetch all profiles and filter in JavaScript for now
    // For better performance with large datasets, consider using a PostgreSQL function
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');

    if (error) throw error;
    
    // Filter profiles that have at least one of the specified tags
    const filteredData = (data || []).filter(profile => {
      if (!Array.isArray(profile.tags)) return false;
      return tags.some(tag => profile.tags.includes(tag));
    });
    
    return { data: filteredData, error: null };
  } catch (error) {
    console.error('Error fetching profiles by tags:', error);
    return { data: [], error };
  }
};

