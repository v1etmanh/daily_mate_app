package com.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.model.Customer;
import com.app.service.HomePageService;


@RestController
@RequestMapping("/account")
public class HomePageController {
@Autowired
private HomePageService homePageService;
@GetMapping()
public ResponseEntity< Customer> getUserDetailsAfterLogin(@AuthenticationPrincipal Jwt jwt)
{return ResponseEntity.status(HttpStatus.OK).body( this.homePageService.SavenewCus(jwt));
	}
}
