package com.app.model;





import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@AllArgsConstructor
@Data
@RequiredArgsConstructor
public class HealthNews {
	private String title;
    private String link;
    private String description;
    private Date publishedDate;
    private String source;
}
