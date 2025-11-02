package com.app.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class Location {
	   private double lat;       // Vĩ độ
	    private double lon;       // Kinh độ
	    private String city;      // Tên thành phố (có thể là "Vị trí hiện tại")
	    private String country;  
}
