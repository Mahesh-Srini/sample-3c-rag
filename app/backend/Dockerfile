FROM python:3.11-bullseye

WORKDIR /app

COPY ./ /app

RUN python -m pip install --upgrade pip \
	&& python -m pip install -r requirements.txt

ENV QUART_APP=main:app
ENV QUART_ENV=development
ENV QUART_DEBUG=0
ENV LOADING_MODE_FOR_AZD_ENV_VARS=override

EXPOSE 50505

CMD ["quart", "run", "--reload", "-p", "50505"]
