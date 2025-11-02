package com.app.service;

import org.springframework.stereotype.Service;


import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class GoogleMapsService {
    private final String API_KEY = ""; // 👈 Thay bằng key thật

    public String getTrafficDescription(String origin, String destination) {
        try {
            String encodedOrigin = URLEncoder.encode(origin, StandardCharsets.UTF_8);
            String encodedDestination = URLEncoder.encode(destination, StandardCharsets.UTF_8);

            String url = String.format(
                "https://maps.googleapis.com/maps/api/directions/json?origin=%s&destination=%s&departure_time=now&key=%s",
                encodedOrigin, encodedDestination, API_KEY
            );

            RestTemplate restTemplate = new RestTemplate();
            Map response = restTemplate.getForObject(url, Map.class);

            Map route = (Map) ((java.util.List<?>) response.get("routes")).get(0);
            Map leg = (Map) ((java.util.List<?>) route.get("legs")).get(0);

            Map duration = (Map) leg.get("duration");
            Map durationInTraffic = (Map) leg.get("duration_in_traffic");

            int normal = (int) duration.get("value"); // giây
            int withTraffic = (int) durationInTraffic.get("value"); // giây

            int delay = withTraffic - normal;

            if (delay > 900) {
                return "Kẹt xe nặng: mất thêm " + (delay / 60) + " phút so với bình thường.";
            } else if (delay > 300) {
                return "Giao thông hơi đông: trễ khoảng " + (delay / 60) + " phút.";
            } else {
                return "Giao thông thông thoáng.";
            }
        } catch (Exception e) {
            return "Không thể lấy thông tin giao thông.";
        }
    }
}