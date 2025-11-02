package com.app.model;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
@AllArgsConstructor
@RequiredArgsConstructor
@Data
public class Article {
    private String title;
    private String url;
    private String description;
    private Date publishedAt;
    private Source source;
}
