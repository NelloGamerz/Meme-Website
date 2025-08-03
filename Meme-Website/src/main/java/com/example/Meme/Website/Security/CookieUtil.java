package com.example.Meme.Website.Security;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CookieUtil {

    // public void addCookie(HttpServletResponse response, String name, String
    // value, int maxAge) {
    // Cookie cookie = new Cookie(name, value);
    // cookie.setPath("/");
    // cookie.setHttpOnly(true);
    // cookie.setSecure(true);
    // cookie.setMaxAge(maxAge);
    // response.addCookie(cookie);
    // }

    public void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        String cookie = String.format(
                "%s=%s; Max-Age=%d; Path=/; HttpOnly; Secure; SameSite=None",
                name, value, maxAge);
        response.addHeader("Set-Cookie", cookie);
    }

    public void deleteCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    public String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null)
            return null;
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }

        return null;
    }
}
