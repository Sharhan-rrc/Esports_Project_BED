import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsdoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Esports Hub API Documentation",
			version: "1.0.0",
			description:
				"API documentation for the Esports Hub backend application.",
		},
		servers: [
			{
				url: process.env.SWAGGER_SERVER_URL || "http://localhost:3000/api/v1",
				description: "Local server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
	apis: ["./src/api/v1/routes/*.ts", "./src/api/v1/validations/*.ts"],
};

export const generateSwaggerSpec = (): object => {
	return swaggerJsdoc(swaggerOptions);
};
