package com.app.model;

import org.springframework.aot.hint.annotation.RegisterReflection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor

public class WeatherConditionRequest {
private String main;
private String location;
private double Temperature;
private double fellingTemp;
private int humidity;
private int pressure;

}
