package com.app.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import javax.lang.model.element.Element;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.app.model.HealthNews;
import com.app.model.NewsAPIResponse;

@Service
public class HealthService {
	 private final String API_KEY = "";
	 private final String BASE_URL = "https://newsapi.org/v2/everything?q=healthy+eating&language=en&pageSize=10&sortBy=publishedAt&apiKey=";

	    private final RestTemplate restTemplate = new RestTemplate();

	    public List<HealthNews> getHealthNewsFromAPI() {
	        String url = BASE_URL + API_KEY;

	        try {
	            ResponseEntity<NewsAPIResponse> response = restTemplate.getForEntity(url, NewsAPIResponse.class);

	            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
	                return response.getBody().getArticles().stream()
	                    .map(article -> new HealthNews(
	                        article.getTitle(),
	                        article.getUrl(),
	                        article.getDescription(),
	                        article.getPublishedAt(),
	                        article.getSource().getName()
	                    ))
	                    .collect(Collectors.toList());
	            } else {
	                return new ArrayList<>();
	            }
	        } catch (Exception e) {
	            System.err.println("Error calling NewsAPI: " + e.getMessage());
	            return new ArrayList<>();
	        }
	    }
}
