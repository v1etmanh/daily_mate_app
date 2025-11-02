package com.app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.model.HealthNews;
import com.app.service.HealthService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/rss")
@CrossOrigin(origins = "*") // ← mở cho tất cả domain (có thể chỉnh sau)
public class NewsController {
	@Autowired
	private HealthService healthService;
@GetMapping("/news")
public ResponseEntity<List<HealthNews>> getHealthNews() {
    List<HealthNews> news = healthService.getHealthNewsFromAPI();
    return ResponseEntity.ok(news);
}

}
