package com.example.Meme.Website.models;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;


import java.util.Collection;
import java.util.Collections;
import java.util.Optional;


public class UserPrincipal implements UserDetails {

    private userModel user;

    public UserPrincipal(userModel user) {
        this.user = user;
    }

    public static UserPrincipal from(Optional<userModel> optionalUser) {
        return optionalUser.map(UserPrincipal::new)
                          .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority("USER"));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    public String getUserId(){
        return user.getUserId();
    }

    public userModel getUser() {
        return user;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}