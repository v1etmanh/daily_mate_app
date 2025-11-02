package com.app.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
@Service
public class GoogleRecipeSearchService {
	 @Value("${google.search.apiKey}")
	    private String apiKey;

	    @Value("${google.search.cxId}")
	    private String cxId;

	    private final ObjectMapper objectMapper = new ObjectMapper();

	    public String findRecipeUrl(String dishName, String country) {
	        try {
	            String query = URLEncoder.encode(dishName + " recipe " + country, StandardCharsets.UTF_8);
	            String searchUrl = String.format(
	                "https://www.googleapis.com/customsearch/v1?key=%s&cx=%s&q=%s",
	                apiKey, cxId, query
	            );

	            HttpRequest request = HttpRequest.newBuilder()
	                .uri(URI.create(searchUrl))
	                .GET()
	                .build();

	            HttpClient client = HttpClient.newHttpClient();
	            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

	            JsonNode root = objectMapper.readTree(response.body());
	            JsonNode items = root.get("items");

	            if (items != null && items.size() > 0) {
	                return items.get(0).get("link").asText(); // lấy link đầu tiên
	            }

	        } catch (Exception e) {
	            e.printStackTrace();
	        }

	        // fallback nếu thất bại
	        return "https://www.google.com/search?q=" + URLEncoder.encode(dishName + " recipe " + country, StandardCharsets.UTF_8);
	    }
}
