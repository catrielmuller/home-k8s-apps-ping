import * as k8s from "@pulumi/kubernetes";
import { Config } from './config';

const namespace = new k8s.core.v1.Namespace(`${Config.appName}-namespace`, {
  metadata: {
    name: Config.appName,
  },
});

const service = new k8s.core.v1.Service(`${Config.appName}-service`, {
  metadata: {
    name: Config.appName,
    namespace: namespace.metadata.name,
  },
  spec: {
    ports: [
      {
        port: 80,
        targetPort: 80,
      },
    ],
    selector: {
      app: Config.appName,
    },
  },
});

const deployment = new k8s.apps.v1.Deployment(`${Config.appName}-deployment`, {
  metadata: {
    name: Config.appName,
    namespace: namespace.metadata.name,
  },
  spec: {
    selector: {
      matchLabels: {
        app: Config.appName,
      },
    },
    replicas: 2,
    template: {
      metadata: {
        labels: {
          app: Config.appName,
        },
      },
      spec: {
        containers: [
          {
            name: Config.appName,
            image: "tenzer/http-echo-test",
            ports: [
              {
                containerPort: 80,
              },
            ],
            env: [
              {
                name: 'PORT',
                value: '80'
              }
            ]
          },
        ],
      },
    },
  },
});

const ingress = new k8s.networking.v1.Ingress(`${Config.appName}-ingress`, {
  metadata: {
    name: `${Config.appName}-ingress`,
    namespace: namespace.metadata.name,
    annotations: {
      'kubernetes.io/ingress.class': 'nginx',
      "cert-manager.io/cluster-issuer": "letsencrypt-prod",
    },
  },
  spec: {
    tls: [
      {
        hosts: [Config.appDomain],
        secretName: `${Config.appName}-tls`,
      },
    ],
    rules: [
      {
        host: Config.appDomain,
        http: {
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              backend: {
                service: {
                  name: Config.appName,
                  port: {
                    number: 80,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
});
