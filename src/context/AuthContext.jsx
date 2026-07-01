import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cache fetching promise to avoid multiple simultaneous queries for the same user
  const fetchPromise = useRef(null);
  const lastFetchedId = useRef(null);

  // Helper to fetch user profile role and sync info
  const fetchUserProfile = async (currentUser, force = false) => {
    if (!currentUser) {
      setProfile(null);
      setIsAdmin(false);
      lastFetchedId.current = null;
      fetchPromise.current = null;
      return null;
    }

    // Clear cache if user ID changed
    if (lastFetchedId.current !== currentUser.id) {
      setProfile(null);
      setIsAdmin(false);
      fetchPromise.current = null;
      lastFetchedId.current = currentUser.id;
    }

    // If profile already exists for this user and we are not forcing, reuse it
    if (!force && lastFetchedId.current === currentUser.id && profile) {
      return profile;
    }

    // Reuse existing fetch promise if it is for the same user
    if (fetchPromise.current && lastFetchedId.current === currentUser.id) {
      return fetchPromise.current;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, display_name, role")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user profile:", error);
          // Do NOT set fallback role or set isAdmin to false here when query fails
          return null;
        }

        let currentProfile = data;

        // If profile does not exist in public.profiles table, create/sync it
        if (!currentProfile) {
          const metadataDisplayName = currentUser.user_metadata?.display_name;
          const newProfile = {
            id: currentUser.id,
            email: currentUser.email,
            display_name: metadataDisplayName || null,
            role: "user"
          };

          const { data: insertedData, error: insertError } = await supabase
            .from("profiles")
            .insert(newProfile)
            .select("id, email, display_name, role")
            .maybeSingle();

          if (insertError) {
            console.error("Error creating/syncing user profile:", insertError);
            // Do NOT set fallback role or set isAdmin to false here
            return null;
          }
          currentProfile = insertedData;
        } else {
          // Profile exists, verify if email or display_name needs to be updated (without modifying role)
          let needsUpdate = false;
          const updates = {};

          if (!currentProfile.email || currentProfile.email !== currentUser.email) {
            updates.email = currentUser.email;
            needsUpdate = true;
          }

          const metadataDisplayName = currentUser.user_metadata?.display_name;
          if (!currentProfile.display_name && metadataDisplayName) {
            updates.display_name = metadataDisplayName;
            needsUpdate = true;
          }

          if (needsUpdate) {
            const { data: updatedData, error: updateError } = await supabase
              .from("profiles")
              .update(updates)
              .eq("id", currentUser.id)
              .select("id, email, display_name, role")
              .maybeSingle();

            if (updateError) {
              console.error("Error updating/syncing user profile fields:", updateError);
            } else if (updatedData) {
              currentProfile = updatedData;
            }
          }
        }

        if (currentProfile) {
          setProfile(currentProfile);
          setIsAdmin(currentProfile.role === "admin");
          return currentProfile;
        }
      } catch (err) {
        console.error("Unexpected error in fetchUserProfile:", err);
      }
      return null;
    })();

    fetchPromise.current = promise;

    try {
      return await promise;
    } finally {
      if (fetchPromise.current === promise) {
        fetchPromise.current = null;
      }
    }
  };

  useEffect(() => {
    let active = true;

    async function initAuth() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserProfile(currentUser, true);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error getting initial session:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (currentUser) {
          setLoading(true);
          await fetchUserProfile(currentUser, true);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED") {
        if (currentUser) {
          await fetchUserProfile(currentUser, false);
        }
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setIsAdmin(false);
        lastFetchedId.current = null;
        fetchPromise.current = null;
        setLoading(false);
      }
    });

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signInWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    setLoading(true);
    try {
      const options = {};
      if (displayName && displayName.trim()) {
        options.data = {
          display_name: displayName.trim()
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        loading,
        signIn: signInWithEmail,
        signUp: signUpWithEmail,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
